import * as R3F from "@react-three/fiber";
import * as THREE from "three";
import { Layer, useMap } from "react-map-gl";
import { PropsWithChildren, useEffect, useRef, useState } from "react";

import MapCoordinates from "types/MapCoordinates";
import { coordsToMatrix } from "utils/map";

R3F.extend(THREE);

type Events = Parameters<typeof R3F.Canvas>[0]["events"];

interface CanvasProps
  extends Omit<R3F.RenderProps<HTMLCanvasElement>, "frameloop">,
    PropsWithChildren {
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

const CanvasEvents: Events = (store) => {
  return {
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

      events.disconnect!();

      set((state) => ({
        events: { ...state.events, connected: target.parentNode },
      }));

      if (!events.handlers) return;

      for (const [name, handler] of Object.entries(events.handlers)) {
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
  };
};

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

export function Canvas({ id = "3d", center, ...props }: CanvasProps) {
  const map = useMap().current!.getMap();
  const canvasRef = useRef(map.getCanvas());
  const paused = useRef(false);

  const [root] = useState(() => {
    const root = R3F.createRoot(canvasRef.current);

    root.configure({
      dpr: window.devicePixelRatio,
      frameloop: "never",
      events: CanvasEvents,
      ...props,
      gl: {
        context:
          canvasRef.current.getContext("webgl2") ??
          canvasRef.current.getContext("webgl") ??
          undefined,
        canvas: canvasRef.current,
        ...props?.gl,
        autoClear: false,
      },
      camera: {
        matrixAutoUpdate: false,
        matrixWorldAutoUpdate: false,
        near: 1,
        far: 2000,
        aspect: canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      },
      size: {
        width: canvasRef.current.clientWidth,
        height: canvasRef.current.clientHeight,
        updateStyle: false,
        top: canvasRef.current.offsetWidth,
        left: canvasRef.current.offsetHeight,
        ...props?.size,
      },
    });

    return root;
  });

  const [useThree] = useState(() => R3F._roots.get(canvasRef.current!)!.store);

  paused.current = false;

  function render(_gl: WebGL2RenderingContext, projViewMx: THREE.Matrix4Tuple) {
    if (paused.current) return;

    const state = useThree.getState();
    syncCamera(state.camera as THREE.PerspectiveCamera, projViewMx);

    state.gl.resetState();
    state.advance(Date.now() * 0.001, false);

    map.triggerRepaint();
  }

  function onRemove() {
    root.unmount();
  }

  // camera origin changes
  useEffect(() => {
    coordsToMatrix(center, originMx);
  }, [center]);

  // R3F update on children changed
  useEffect(
    () => {
      root.render(props.children);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.children],
  );

  // mount / unmount
  useEffect(() => {
    function handleResize() {
      const { setDpr, setSize } = useThree.getState();

      setDpr(window.devicePixelRatio);
      setSize(
        canvasRef.current.clientWidth,
        canvasRef.current.clientHeight,
        false,
        canvasRef.current.offsetWidth,
        canvasRef.current.offsetHeight,
      );
    }

    map.on("resize", handleResize);

    return () => {
      map.off("resize", handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useThree]);

  return (
    <Layer
      id={id}
      onRemove={onRemove}
      render={render}
      // see https://docs.mapbox.com/mapbox-gl-js/api/properties/#customlayerinterface
      // 'custom' is required when a layer has a user-defined render callback
      // @ts-ignore
      type="custom"
      renderingMode="3d"
    />
  );
}
