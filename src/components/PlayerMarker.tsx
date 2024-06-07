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
      <div className="h-[54px] rounded-full border-2 flex justify-center border-black">
        <div className="absolute -top-5 text-black drop-shadow-[1px_1px_darkorange] text-[16px] font-bold">
          JulesVerne
        </div>

        <div>
          <img
            className="rounded-full"
            src="/images/profilePic.webp"
            width="50"
            height="50"
            alt={""}
          />
        </div>
      </div>
    </Marker>
  );
}
