import * as THREE from "three";

import { Canvas } from "adapters/R3FMapbox";
import { MapCoordinates } from "types";
import { coordsToMatrix } from "utils/map";
import { useCircleIndicatorProps } from "providers/CircleIndicatorProps";
import { useRef } from "react";

export default function CanvasOverlay({
  coordinates,
  current,
}: {
  coordinates: MapCoordinates;
  current: MapCoordinates;
}) {
  const initialMatrixRef = useRef(coordsToMatrix(coordinates).invert());

  const { visible, size, color, opacity } = useCircleIndicatorProps();

  function meshCallback(node: THREE.Mesh) {
    if (!node) return;

    node.matrixAutoUpdate = false;
    node.matrix.multiplyMatrices(
      initialMatrixRef.current,
      coordsToMatrix({
        ...current,
        rotation: [0, 0, 0],
      }),
    );
  }

  return (
    <Canvas
      center={coordinates}
      gl={{
        alpha: false,
        antialias: false,
        precision: "lowp",
        powerPreference: "low-power",
        // @ts-ignore reduce input latency
        desynchronized: true,
      }}
    >
      <hemisphereLight
        args={["#ffffff", "#60666C"]}
        position={[0, 1000, 0]}
        intensity={4}
      />

      <mesh
        ref={meshCallback}
        visible={visible}
      >
        <ringGeometry args={[size - 0.33, size, 64]} />
        <meshStandardMaterial
          transparent
          color={color}
          opacity={opacity}
          side={THREE.DoubleSide}
        />
      </mesh>
    </Canvas>
  );
}
