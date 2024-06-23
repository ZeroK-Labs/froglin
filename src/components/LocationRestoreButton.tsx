import { useEffect, useState } from "react";

import { PlayerMarkerImage } from "components";
import { VIEW } from "settings";
import { disableMapActions, enableMapActionsPlayground } from "utils/mapbox";
import { useLocation } from "stores";

export default function LocationRestoreButton({ map }: { map: mapboxgl.Map }) {
  const [contained, setContained] = useState(true);

  const { coordinates } = useLocation();

  function handleClick() {
    setContained(true);
    disableMapActions(map);

    map.flyTo({
      center: [coordinates.longitude, coordinates.latitude],
      zoom: VIEW.PLAYGROUND.ZOOM,
      pitch: VIEW.PLAYGROUND.PITCH,
      bearing: VIEW.PLAYGROUND.BEARING,
      duration: VIEW.VIEW_ANIMATION_DURATION,
    });

    map.once("moveend", () => {
      enableMapActionsPlayground(map);
    });
  }

  useEffect(
    () => {
      function checkBounds() {
        const { clientWidth: width, clientHeight: height } = map.getContainer();
        const { x, y } = map.project([coordinates.longitude, coordinates.latitude]);

        setContained(x >= 0 && x <= width && y >= 0 && y <= height);
      }

      map.on("move", checkBounds);

      return () => {
        map.off("move", checkBounds);
      };
    }, //
    [coordinates],
  );

  return contained ? null : (
    <button
      className="fixed bottom-6 right-6 z-[9999] rounded-md"
      onClick={handleClick}
    >
      <PlayerMarkerImage size="40px" />
    </button>
  );
}
