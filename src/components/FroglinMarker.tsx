import { useEffect, useState } from "react";
import { Marker } from "react-map-gl";
import { Froglin } from "types";

import MapCoordinates from "types/MapCoordinates";

export default function FroglinMarker({
  location,
  revealed = false,
  froglin,
}: {
  location: MapCoordinates;
  froglin?: Froglin;
  revealed?: boolean;
}) {
  const [message, setMessage] = useState<string>("");

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
  }, [location.latitude, location.longitude]);

  if (!location) return null;

  return (
    <Marker
      longitude={location.longitude}
      latitude={location.latitude}
    >
      <div
        className="rounded-full flex flex-col items-center justify-center"
        onClick={showStats}
      >
        {message ? (
          <div className="absolute -top-[20px] text-gray-800 text-[12px] whitespace-nowrap bg-green-400 p-1.5 rounded-sm leading-3 tracking-wider z-0">
            {message}
          </div>
        ) : null}

        <img
          className="rounded-full z-10"
          src={`/images/froglin${revealed ? froglin?.type : "1"}.png`}
          width={`${revealed ? "36" : "28"}px`}
          height={`${revealed ? "36" : "28"}px`}
          alt=""
        />
      </div>
    </Marker>
  );
}
