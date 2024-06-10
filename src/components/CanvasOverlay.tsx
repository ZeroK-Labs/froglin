import * as THREE from "three";

import { Canvas } from "adapters/R3FMapbox";
import { MapCoordinates } from "types";
import { MinusHalfPI } from "utils/math";
import { REVEAL_RADIUS } from "components/PlayerMarker";
import { useCircleIndicatorProps } from "providers/CircleIndicatorProps";

export default function CanvasOverlay({
  coordinates,
}: {
  coordinates: MapCoordinates;
}) {
  const { visible, size, color, opacity } = useCircleIndicatorProps();

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
        <ringGeometry args={[REVEAL_RADIUS - 0.33, size, 64]} />
        <meshStandardMaterial
          transparent
          color="rgb(122, 30, 185)"
          opacity={0.25}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh
        visible={visible}
        rotation={[MinusHalfPI, 0, 0]}
      >
        <ringGeometry args={[size - 0.25, size, 64]} />
        <meshStandardMaterial
          transparent
          color={color}
          opacity={opacity}
          side={THREE.FrontSide}
        />
      </mesh>
    </Canvas>
  );
}
