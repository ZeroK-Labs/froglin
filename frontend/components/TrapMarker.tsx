import { useEffect, useRef, useState } from "react";
import { Marker } from "react-map-gl";

import type { MapCoordinates } from "common/types";
import { PLAYER } from "frontend/settings";

type Props = {
  ordinal: number;
  location: MapCoordinates;
  duplicate?: boolean;
};

export default function TrapMarker(props: Props) {
  const trapLabelRef = useRef(`Trap ${props.ordinal}`);

  const [text, setText] = useState(trapLabelRef.current);

  useEffect(
    () => {
      if (!props.duplicate) return;

      setText(PLAYER.TRAP.DUPLICATE_TEXT);

      const timer = setTimeout(
        setText,
        PLAYER.TRAP.DUPLICATE_TEXT_TIMEOUT,
        trapLabelRef.current,
      );

      return () => {
        clearTimeout(timer);
      };
    }, //
    [props.duplicate],
  );

  return (
    <Marker
      longitude={props.location.longitude}
      latitude={props.location.latitude}
      style={{ zIndex: 9998 }}
    >
      <div className="relative top-[-48px] p-1.5 text-[10px] leading-3 tracking-wider rounded-sm whitespace-nowrap text-gray-800 bg-green-400">
        {text}
      </div>
      <div
        className="relative text-[56px] top-[-18px]"
        style={{
          filter:
            "sepia(1) hue-rotate(220deg) saturate(5) brightness(0.7) contrast(1.2)",
        }}
      >
        📍
      </div>
    </Marker>
  );
}
