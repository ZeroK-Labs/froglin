import { Marker } from "react-map-gl";

import MapCoordinates from "types/MapCoordinates";

export default function PlayerMarker({
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
        <div className="absolute -top-4 text-white text-[9px] whitespace-nowrap bg-green-800 px-2 leading-3 tracking-wider">
          Jules Verne
        </div>

        <div>
          <img
            className="rounded-full"
            src="/images/profilePic.webp"
            width="40"
            height="40"
            alt={""}
          />
        </div>
      </div>
    </Marker>
  );
}
