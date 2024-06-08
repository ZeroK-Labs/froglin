import * as THREE from "three";

import { Canvas } from "adapters/R3FMabox";
import { MapCoordinates } from "types";

export default function CanvasOverlay({
  coordinates,
  mode = "flute",
}: {
  coordinates: MapCoordinates;
  mode?: "flute" | "capture";
}) {
  let radius: number = mode === "flute" ? 50 : 10;
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

      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 1, radius, 64]} />
        <meshStandardMaterial
          color={mode === "flute" ? "green" : "red"}
          opacity={0.6}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>
    </Canvas>
  );
}
