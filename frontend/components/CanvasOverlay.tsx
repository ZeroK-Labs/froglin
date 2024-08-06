import { useMap } from "react-map-gl";

import RevealingCircle from "frontend/assets/R3F/RevealingCircle";
import { Canvas } from "frontend/adapters/R3FMapbox";
import { useLocation, useRevealingCircleState } from "frontend/stores";

export default function CanvasOverlay() {
  const { coordinates } = useLocation();
  const map = useMap().current!.getMap();

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

      <RevealingCircle
        {...useRevealingCircleState()}
        map={map}
      />
    </Canvas>
  );
}
