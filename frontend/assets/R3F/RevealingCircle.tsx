import { BackSide, FrontSide } from "three";
import { useEffect, useState } from "react";

import type { RevealingCircleState } from "frontend/types";
import { MinusHalfPI } from "common/utils/math";
import { PLAYER } from "frontend/settings";

export default function RevealingCircle({
  visible,
  size,
  opacity,
  map,
}: RevealingCircleState & { map: mapboxgl.Map }) {
  const [currentOpacity, setCurrentOpacity] = useState(opacity);
  const [currentVisible, setCurrentVisible] = useState(visible);

  useEffect(() => {
    let frameId: number;
    const start = performance.now();

    function animate(time: number) {
      const progress = (time - start) / 1_000; // duration in miliseconds

      if (visible) {
        const newOpacity = Math.min(progress, opacity);
        setCurrentOpacity(newOpacity);

        if (newOpacity < opacity) frameId = requestAnimationFrame(animate);
      } //
      else {
        const newOpacity = Math.max(opacity - progress, 0);
        setCurrentOpacity(newOpacity);

        if (newOpacity > 0) frameId = requestAnimationFrame(animate);
        else setCurrentVisible(false);
      }

      map.triggerRepaint();
    }

    if (visible) setCurrentVisible(true);

    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [visible, opacity]);

  return (
    <>
      <mesh
        visible={currentVisible}
        rotation={[MinusHalfPI, 0, 0]}
      >
        <ringGeometry args={[PLAYER.REVEAL.RADIUS - 0.33, size, 64]} />
        <meshStandardMaterial
          transparent
          color={PLAYER.REVEAL.FILL}
          opacity={0.3 * currentOpacity}
          side={BackSide}
        />
      </mesh>

      <mesh
        visible={currentVisible}
        rotation={[MinusHalfPI, 0, 0]}
      >
        <ringGeometry args={[size - 0.25, size, 64]} />
        <meshStandardMaterial
          transparent
          color={PLAYER.REVEAL.OUTLINE}
          opacity={currentOpacity}
          side={FrontSide}
        />
      </mesh>
    </>
  );
}
