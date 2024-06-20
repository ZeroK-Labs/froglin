import { BackSide, FrontSide } from "three";

import { Canvas } from "adapters/R3FMapbox";
import { PLAYER } from "settings";
import { MinusHalfPI } from "utils/math";
import { useCircleIndicatorState, useLocation } from "stores";

export default function CanvasOverlay() {
  const { coordinates } = useLocation();
  const { visible, size, color, opacity } = useCircleIndicatorState();

  return (
    <Canvas
      center={coordinates}
      gl={{
        alpha: false,
        antialias: false,
        precision: "lowp",
        powerPreference: "low-power",
        // @ts-expect-error - reduce input latency
        desynchronized: true,
      }}
    >
      <hemisphereLight
        args={["#FFFFFF", "#60666C"]}
        intensity={4}
      />

      <mesh
        visible={visible}
        rotation={[MinusHalfPI, 0, 0]}
      >
        <ringGeometry args={[PLAYER.REVEAL_RADIUS - 0.33, size, 64]} />
        <meshStandardMaterial
          transparent
          color="rgb(122, 30, 185)"
          opacity={0.25}
          side={BackSide}
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
          side={FrontSide}
        />
      </mesh>
    </Canvas>
  );
}
