import mapboxgl from "mapbox-gl";
import { useEffect, useState } from "react";

import { AvatarImage } from "components";
import { MAP_VIEWS } from "enums";
import { MapCoordinates } from "types";

export default function MyLocationButton({
  map,
  location,
}: {
  map: mapboxgl.Map | null;
  location: MapCoordinates;
}) {
  const [contained, setContained] = useState(true);

  function handleNavigateToCurrentLocation() {
    if (!map) return;

    setContained(true);
    map.flyTo({
      center: [location.longitude, location.latitude],
      zoom: MAP_VIEWS.PLAYGROUND,
      pitch: 60,
      bearing: -30,
      duration: 3_000,
    });
  }

  useEffect(() => {
    if (!map) return;

    function checkBounds() {
      setContained(
        map!.getBounds().contains([location.longitude, location.latitude]),
      );
    }

    map.on("drag", checkBounds);
    map.on("dragend", checkBounds);
    map.on("idle", checkBounds);

    return () => {
      map.off("drag", checkBounds);
      map.off("dragend", checkBounds);
      map.off("idle", checkBounds);
    };
  }, [map]);

  return contained ? null : (
    <button
      className="absolute bottom-6 right-6 z-[9999] rounded-md"
      onClick={handleNavigateToCurrentLocation}
    >
      <AvatarImage size="40px" />
    </button>
  );
}
