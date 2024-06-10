import { useEffect, useRef, useState } from "react";
import { Marker } from "react-map-gl";
import { Froglin } from "types";

import MapCoordinates from "types/MapCoordinates";

type Props = {
  location: MapCoordinates;
  froglin?: Froglin;
  updateCaught?: (froglinId: number) => void;
};

const duration = 500;

export default function FroglinMarker(props: Props) {
  const locationRef = useRef({ ...props.location });
  const [message, setMessage] = useState<string>("");
  const [opacity, setOpacity] = useState(0);

  const revealed = props.froglin != null;

  function showStats() {
    if (revealed) {
      setMessage("Catch me if you can, mr Hanks!");
    } else {
      setMessage("A froglin?! My flute will reveal it!");
    }
    setTimeout(() => {
      setMessage("");
    }, 3_000);
  }

  useEffect(() => {
    setMessage("");

    setOpacity(0);
    setTimeout(() => {
      locationRef.current.longitude = props.location.longitude;
      locationRef.current.latitude = props.location.latitude;
      setOpacity(1);
    }, duration);
  }, [props.location.longitude, props.location.latitude]);

  if (!props.location) return null;

  return (
    <Marker
      longitude={locationRef.current.longitude}
      latitude={locationRef.current.latitude}
    >
      <div
        style={{
          opacity,
          transition: `opacity ${duration}ms ease-in`,
        }}
        className={`rounded-full flex flex-col items-center justify-center ${message ? "z-[9999]" : ""}`}
        onClick={showStats}
      >
        {message ? (
          <div
            className="absolute -top-[20px] text-gray-800 text-[12px] whitespace-nowrap bg-green-400 p-1.5 rounded-sm leading-3 tracking-wider z-0"
            {...(revealed
              ? {
                  onClick: () => {
                    props.updateCaught!(props.froglin!.id);
                  },
                }
              : null)}
          >
            {message}
          </div>
        ) : null}

        <img
          className="rounded-full z-10"
          src={`/images/froglin${revealed ? props.froglin!.type : "1"}.png`}
          width={`${revealed ? "36" : "28"}px`}
          height={`${revealed ? "36" : "28"}px`}
          alt=""
        />
      </div>
    </Marker>
  );
}
