import React, { useRef, useState, useEffect } from "react";
import { Marker } from "react-map-gl";

import type { WorldEvent } from "common/types";
import { FROGLIN, VIEW } from "frontend/settings";

type Props = {
  visible: boolean;
  event: WorldEvent;
};

export default function WorldEventMarker(props: Props) {
  const locationRef = useRef(props.event.coordinates);

  const [opacity, setOpacity] = useState(0);
  const [message, setMessage] = useState<string>("");

  function handlePinClick(ev: React.MouseEvent) {
    setMessage(props.event.name);
    setTimeout(setMessage, FROGLIN.MARKER.MESSAGE_TIMEOUT, "");

    ev.stopPropagation();
  }

  useEffect(
    () => {
      if (!props.visible) {
        setOpacity(0);

        return;
      }

      const timer = setTimeout(setOpacity, VIEW.TRANSITION_DURATION - 500, 1);

      return () => {
        clearTimeout(timer);
      };
    }, //
    [props.visible],
  );

  return (
    <>
      <svg className="absolute -left-full">
        <filter
          id="colorize-purple"
          colorInterpolationFilters="sRGB"
        >
          <feColorMatrix
            type="matrix"
            values="0.3 0   0   0   0.15
                    0   0.1 0   0   0
                    0.2 0   0.5 0   0.25
                    0 0 0   1 0"
          />
        </filter>
      </svg>

      <Marker
        longitude={locationRef.current.lng}
        latitude={locationRef.current.lat}
      >
        {message ? (
          <div className="z-999999 p-0.5 rounded-md text-[12px] leading-3 tracking-wider whitespace-nowrap text-gray-800 shadow-lg">
            <div className="max-w-xs mx-auto p-4 rounded-lg bg-green-400">
              <h2 className="mb-2 text-2xl font-semibold">{props.event.name}</h2>
              <p className="mb-2 italic font-semibold text-gray-500">
                {props.event.conference}
              </p>
              <div className="flex items-center justify-center space-x-1">
                <p>{props.event.attendance}</p>
                <p className="text-gray-500">attendees</p>
              </div>
              <p className="mt-4">{props.event.coordinates.lng}° longitude</p>
              <p>{props.event.coordinates.lat}° latitude</p>
            </div>
          </div>
        ) : (
          <div
            className="text-3xl z-0"
            style={{
              opacity,
              filter: "url(#colorize-purple)",
              transition: `opacity ${FROGLIN.MARKER.TRANSITION_DURATION}ms ease-in`,
            }}
            onClick={handlePinClick}
          >
            📌
          </div>
        )}
      </Marker>
    </>
  );
}
