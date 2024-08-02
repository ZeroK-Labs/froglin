import { useMap } from "react-map-gl";

import RevealingCircle from "src/assets/R3F/RevealingCircle";
import { Canvas } from "src/adapters/R3FMapbox";
import { useLocation, useRevealingCircleState } from "src/stores";

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
