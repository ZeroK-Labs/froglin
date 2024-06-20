import mapboxgl from "mapbox-gl";
import { useEffect, useState } from "react";

import { VIEW } from "settings";
import { PlayerMarkerImage } from "components";
import { useLocation } from "stores";

export default function LocationRestoreButton({ map }: { map: mapboxgl.Map }) {
  const [contained, setContained] = useState(true);

  const { coordinates } = useLocation();

  function handleClick() {
    setContained(true);

    map.flyTo({
      center: [coordinates.longitude, coordinates.latitude],
      zoom: VIEW.PLAYGROUND.ZOOM,
      pitch: VIEW.PLAYGROUND.PITCH,
      bearing: VIEW.PLAYGROUND.BEARING,
      duration: VIEW.VIEW_ANIMATION_DURATION,
    });
  }

  useEffect(
    () => {
      function checkBounds() {
        const container = map.getContainer();
        const width = container.clientWidth;
        const height = container.clientHeight;

        const point = map.project([coordinates.longitude, coordinates.latitude]);

        setContained(
          point.x >= 0 && point.x <= width && point.y >= 0 && point.y <= height,
        );
      }

      map.on("move", checkBounds);

      return () => {
        map.off("move", checkBounds);
      };
    }, //
    [],
  );

  return contained ? null : (
    <button
      className="absolute bottom-6 right-6 z-[9999] rounded-md"
      onClick={handleClick}
    >
      <PlayerMarkerImage size="40px" />
    </button>
  );
}
