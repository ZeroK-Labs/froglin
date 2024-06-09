import * as THREE from "three";

import { Canvas } from "adapters/R3FMabox";
import { MapCoordinates } from "types";
import { MinusHalfPI } from "utils/math";
import { useCircleIndicatorProps } from "providers/CircleIndicatorProps";

export default function CanvasOverlay({
  coordinates,
}: {
  coordinates: MapCoordinates;
}) {
  const { visible, size, color, opacity } = useCircleIndicatorProps();

  console.log(size);

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
        visible={visible}
        rotation={[MinusHalfPI, 0, 0]}
      >
        <ringGeometry args={[size - 0.5, size, 64]} />
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
