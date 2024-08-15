import { Marker } from "react-map-gl";
import { useEffect, useRef, useState } from "react";

import { FROGLIN } from "frontend/settings";
import { MapCoordinates } from "common/types";

type BaseMarkerProps = {
  coordinates: MapCoordinates;
  visible?: boolean;
  message: string;
  imageSrc: string;
  imageWidth: string;
  imageHeight: string;
  onMessageClick?: () => void;
};

export default function BaseMarker(props: BaseMarkerProps) {
  const locationRef = useRef(props.coordinates);

  const [message, setMessage] = useState<string>("");
  const [opacity, setOpacity] = useState(0);

  function showMessage() {
    setMessage(props.message);
    setTimeout(setMessage, FROGLIN.MARKER.MESSAGE_TIMEOUT, "");
  }

  // fade-out when hidden; fade-out at old position and fade-in at new position
  useEffect(
    () => {
      setMessage("");
      setOpacity(0);

      if (!props.visible) return;

      const timer = setTimeout(() => {
        locationRef.current = props.coordinates;
        setOpacity(1);
      }, FROGLIN.MARKER.TRANSITION_DURATION);

      return () => {
        clearTimeout(timer);
      };
    }, //
    [props.visible, props.coordinates.longitude, props.coordinates.latitude],
  );

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
        onClick={showMessage}
      >
        {message && (
          <div
            className="z-0 absolute -top-[20px] p-1.5 rounded-sm text-[12px] leading-3 tracking-wider whitespace-nowrap text-gray-800 bg-green-400"
            style={{ pointerEvents: "all" }}
            onClick={props.onMessageClick}
          >
            {message}
          </div>
        )}

        <img
          className="z-10 rounded-full"
          src={props.imageSrc}
          width={props.imageWidth}
          height={props.imageHeight}
          alt=""
        />
      </div>
    </Marker>
  );
}
