import { Marker } from "react-map-gl";

import MapCoordinates from "types/MapCoordinates";

export default function FroglinMarker({
  location,
}: {
  location: MapCoordinates;
}) {
  if (!location) return null;

  return (
    <Marker
      longitude={location.longitude}
      latitude={location.latitude}
    >
      <div className="h-[40px] rounded-full flex justify-center">
        <div className="absolute -top-4 text-white text-[9px] whitespace-nowrap bg-green-400 px-2 leading-3 tracking-wider">
          !@#$ ??
        </div>

        <div>
          <img
            className="rounded-full"
            src="/images/froglin1.png"
            width="25"
            height="25"
            alt=""
          />
        </div>
      </div>
    </Marker>
  );
}
