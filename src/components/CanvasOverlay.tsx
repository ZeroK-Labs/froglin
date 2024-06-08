import * as THREE from "three";

import { Canvas } from "adapters/R3FMabox";
import { MapCoordinates } from "types";

export default function CanvasOverlay({
  coordinates,
}: {
  coordinates: MapCoordinates;
}) {
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
        <ringGeometry args={[48, 50, 64]} />
        <meshStandardMaterial
          color={"green"}
          opacity={0.6}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>
    </Canvas>
  );
}
