import * as THREE from "three";
import * as R3F from "@react-three/fiber";
import { Layer, useMap } from "react-map-gl";
import { PropsWithChildren, useEffect, useState } from "react";

import MapCoordinates from "types/MapCoordinates";
import { getMatrixTransformForCoordinate } from "utils/map";

interface BaseCanvasProps
  extends Omit<R3F.RenderProps<HTMLCanvasElement>, "dpr">,
    Omit<R3F.RenderProps<HTMLCanvasElement>, "frameloop">,
    PropsWithChildren {}

export interface CanvasProps extends BaseCanvasProps {
  id?: string;
  center: MapCoordinates;
}

const DOM_EVENTS = {
  onClick: "click",
  onContextMenu: "contextmenu",
  onDoubleClick: "dblclick",
  onWheel: "wheel",
  onPointerDown: "pointerdown",
  onPointerUp: "pointerup",
  onPointerLeave: "pointerleave",
  onPointerMove: "pointermove",
  onPointerCancel: "pointercancel",
  onLostPointerCapture: "lostpointercapture",
} as const;

type DOMEventNames = keyof typeof DOM_EVENTS;

const originMx = new THREE.Matrix4();
const projViewMx = new THREE.Matrix4();
const projViewInvMx = new THREE.Matrix4();
const forwardV = new THREE.Vector3(0, 0, 1);

let canvas: HTMLCanvasElement;
let r3fRoot: R3F.ReconcilerRoot<HTMLCanvasElement>;

R3F.extend(THREE);

function getR3FRoot({ ...props }: BaseCanvasProps = {}) {
  R3F._roots.delete(canvas);
  if (r3fRoot) r3fRoot.unmount();

  r3fRoot = R3F.createRoot(canvas);

  r3fRoot.configure({
    events: (store) => ({
      ...R3F.events(store),

      disconnect: () => {
        const { set, events } = store.getState();
        if (!events.connected) return;

        for (const [name, handler] of Object.entries(events.handlers!)) {
          events.connected.removeEventListener(
            DOM_EVENTS[name as DOMEventNames],
            handler,
          );
        }

        set((state) => ({ events: { ...state.events, connected: null } }));
      },

      connect: (target: HTMLElement) => {
        const { set, events } = store.getState();

        set((state) => ({
          events: { ...state.events, connected: target.parentNode },
        }));

        for (const [name, handler] of Object.entries(events.handlers!)) {
          target.addEventListener(DOM_EVENTS[name as DOMEventNames], handler);
        }
      },

      compute: (event, state) => {
        if (!state.camera.userData.projViewInvMx) return;

        state.pointer.x = (event.offsetX / state.size.width) * 2 - 1;
        state.pointer.y = 1 - (event.offsetY / state.size.height) * 2;

        state.raycaster.camera = state.camera;
        state.raycaster.ray.origin
          .setScalar(0)
          .applyMatrix4(state.camera.userData.projViewInvMx);

        state.raycaster.ray.direction
          .set(state.pointer.x, state.pointer.y, 1)
          .applyMatrix4(state.camera.userData.projViewInvMx)
          .sub(state.raycaster.ray.origin)
          .normalize();
      },
    }),
    ...props,
    dpr: window.devicePixelRatio,
    frameloop: "never",
    gl: {
      canvas,
      context: canvas.getContext("webgl2") ?? undefined,
      autoClear: false,
    },
    camera: {
      matrixAutoUpdate: false,
      matrixWorldAutoUpdate: false,
      near: 1,
      far: 2_000,
      aspect: canvas.clientWidth / canvas.clientHeight,
    },
    size: {
      width: canvas.clientWidth,
      height: canvas.clientHeight,
      updateStyle: false,
      top: canvas.offsetWidth,
      left: canvas.offsetHeight,
    },
  });

  return r3fRoot;
}

function getCanvas() {
  canvas = document.querySelector("canvas")!;
  if (canvas) return canvas;

  console.error("Failed to adapt R3F Canvas to MapboxGL: missing canvas element");
}

function getTHREE() {
  return R3F._roots.get(canvas)!.store.getState();
}

function syncCamera(
  camera: THREE.PerspectiveCamera,
  mapProjViewMx: THREE.Matrix4Tuple,
) {
  projViewMx.fromArray(mapProjViewMx).multiply(originMx);
  projViewInvMx.copy(projViewMx).invert();

  camera.position.set(0, 0, 0).applyMatrix4(projViewInvMx);
  camera.up
    .set(0, -1, 0)
    .applyMatrix4(projViewInvMx)
    .negate()
    .add(camera.position)
    .normalize();
  forwardV.set(0, 0, 1).applyMatrix4(projViewInvMx);
  camera.lookAt(forwardV);

  camera.updateMatrix();
  camera.updateMatrixWorld(true);

  camera.projectionMatrix.copy(camera.matrix).premultiply(projViewMx);
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();

  camera.userData.projViewInvMx = projViewInvMx;
}

export function Canvas({ id = "3d", center, children, ...props }: CanvasProps) {
  const [canvas] = useState(getCanvas);
  const [root] = useState(() => getR3FRoot(props));
  const [state] = useState(getTHREE);
  const [map] = useState(useMap().current!.getMap);

  function render(_: never, projViewMx: THREE.Matrix4Tuple) {
    syncCamera(state.camera as THREE.PerspectiveCamera, projViewMx);
    state.gl.resetState();
    state.advance(Date.now() * 0.001, false);
  }

  // camera origin changes
  useEffect(
    () => {
      getMatrixTransformForCoordinate(center, originMx);
    }, //
    [center.longitude, center.latitude],
  );

  // R3F update on children changed
  useEffect(
    () => {
      console.log("\x1b[30mR3FMapbox - repaint\x1b[0m");

      root.render(children);
      map.triggerRepaint();
    }, //
    [children],
  );

  // mount / unmount
  useEffect(
    () => {
      function handleResize() {
        const { setDpr, setSize } = state;

        setDpr(window.devicePixelRatio);
        setSize(
          canvas!.clientWidth,
          canvas!.clientHeight,
          false,
          canvas!.offsetWidth,
          canvas!.offsetHeight,
        );
      }

      map.on("resize", handleResize);

      return () => {
        map.off("resize", handleResize);
      };
    }, //
    [],
  );

  return (
    <Layer
      // @ts-expect-error - see https://docs.mapbox.com/mapbox-gl-js/api/properties/#customlayerinterface
      // 'custom' is required when a layer has a user-defined render callback
      type="custom"
      // performing depth-testing in R3F, so disable mapbox's depth-testing
      renderingMode="2d"
      id={id}
      render={render}
    />
  );
}
