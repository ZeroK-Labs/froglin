import { Marker } from "react-map-gl";
import { useEffect, useRef, useState } from "react";

import { FROGLIN } from "settings";
import { InterestPoint } from "types";

type Props = {
  point: InterestPoint;
};

export default function InterestPointMarker(props: Props) {
  const locationRef = useRef(props.point.coordinates);
  const [message, setMessage] = useState<string>("");
  const [opacity, setOpacity] = useState(Number(props.point.visible ?? 0));

  function showStats() {
    setMessage("A froglin?! My flute will reveal it!");
    setTimeout(setMessage, FROGLIN.MARKER.MESSAGE_TIMEOUT, "");
  }

  useEffect(
    () => {
      setMessage("");
      setOpacity(0);

      if (!props.point.visible) return;

      // wait for the opacity transition to finish fading out
      const timer = setTimeout(() => {
        locationRef.current = props.point.coordinates;
        setOpacity(1);
      }, FROGLIN.MARKER.TRANSITION_DURATION);

      return () => {
        clearTimeout(timer);
      };
    }, //
    [
      props.point.visible,
      props.point.coordinates.longitude,
      props.point.coordinates.latitude,
    ],
  );

  if (!props.point) return null;

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
          >
            {message}
          </div>
        ) : null}

        <img
          className="rounded-full z-10"
          src={`/images/froglin1.png`}
          width="28px"
          height="28px"
          alt=""
        />
      </div>
    </Marker>
  );
}
