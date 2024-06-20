import { Marker } from "react-map-gl";
import { useEffect, useRef, useState } from "react";

import { FROGLIN } from "settings";
import { Froglin } from "types";
import { useGameEventState } from "stores";

type Props = {
  froglin: Froglin;
};

export default function FroglinMarker(props: Props) {
  const locationRef = useRef(props.froglin.coordinates);
  const [message, setMessage] = useState<string>("");
  const [opacity, setOpacity] = useState(0);

  const { captureFroglins } = useGameEventState();

  function showStats() {
    setMessage("Tap here to capture");
    setTimeout(setMessage, FROGLIN.MARKER.MESSAGE_TIMEOUT, "");
  }

  useEffect(
    () => {
      setMessage("");

      setOpacity(0);
      setTimeout(() => {
        locationRef.current = props.froglin.coordinates;
        setOpacity(1);
      }, FROGLIN.MARKER.TRANSITION_DURATION);
    }, //
    [props.froglin.coordinates.longitude, props.froglin.coordinates.latitude],
  );

  if (!props.froglin.coordinates) return null;

  return (
    <Marker
      longitude={locationRef.current.longitude}
      latitude={locationRef.current.latitude}
    >
      <div
        style={{
          opacity,
          transition: `opacity ${FROGLIN.MARKER.TRANSITION_DURATION}ms ease-in`,
        }}
        className="rounded-full flex flex-col items-center justify-center"
        onClick={showStats}
      >
        {message ? (
          <div
            className="absolute -top-[20px] text-gray-800 text-[12px] whitespace-nowrap bg-green-400 p-1.5 rounded-sm leading-3 tracking-wider z-0"
            style={{ pointerEvents: "all" }}
            onClick={() => {
              captureFroglins([props.froglin.id]);
            }}
          >
            {message}
          </div>
        ) : null}

        <img
          className="rounded-full z-10"
          src={`/images/froglin${props.froglin.type}.png`}
          width="36px"
          height="36px"
          alt=""
        />
      </div>
    </Marker>
  );
}
