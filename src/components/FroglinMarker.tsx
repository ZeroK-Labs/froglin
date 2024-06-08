import { useEffect, useState } from "react";
import { Marker } from "react-map-gl";

import MapCoordinates from "types/MapCoordinates";

export default function FroglinMarker({
  location,
  revealed = false,
}: {
  location: MapCoordinates;
  revealed?: boolean;
}) {
  const [message, setMessage] = useState<string>("");
  useEffect(() => {
    if (message) {
      setTimeout(() => {
        setMessage("");
      }, 1500);
    }
  }, [message]);
  if (!location) return null;

  return (
    <Marker
      longitude={location.longitude}
      latitude={location.latitude}
    >
      <div
        className="h-[40px] rounded-full flex justify-center z-0"
        onClick={() => setMessage("BADABUM!!!")}
      >
        {revealed ? (
          <div className="absolute -top-4 text-white text-[8px] whitespace-nowrap bg-green-400 px-2 leading-3 tracking-wider">
            !@#$ ??
          </div>
        ) : null}
        {message ? (
          <div className="absolute -top-4 text-white text-[8px] whitespace-nowrap bg-green-400 px-2 leading-3 tracking-wider">
            {message}
          </div>
        ) : null}

        {!revealed ? (
          <div>
            <img
              className="rounded-full"
              src="/images/froglin1.png"
              width="20"
              height="20"
              alt=""
            />
          </div>
        ) : (
          <div>
            <img
              className="rounded-full"
              src="/images/froglin2.png"
              width="20"
              height="20"
              alt=""
            />
          </div>
        )}
      </div>
    </Marker>
  );
}
