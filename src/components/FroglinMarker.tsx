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

  function showStats() {
    setMessage("Show FROGLIN STATS");
    setTimeout(() => {
      setMessage("");
    }, 1500);
  }

  if (!location) return null;

  return (
    <Marker
      longitude={location.longitude}
      latitude={location.latitude}
    >
      <div
        className="h-[40px] rounded-full flex justify-center z-0"
        onClick={showStats}
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

        <div>
          <img
            className="rounded-full"
            src={`/images/froglin${revealed ? "2" : "1"}.png`}
            width={`${revealed ? "3" : "2"}0px`}
            height={`${revealed ? "3" : "2"}0px`}
            alt=""
          />
        </div>
      </div>
    </Marker>
  );
}
