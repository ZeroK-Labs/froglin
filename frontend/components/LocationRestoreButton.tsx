import { useEffect, useState } from "react";

import { PlayerMarkerImage } from "frontend/components";
import { VIEW } from "frontend/settings";
import { useLocation } from "frontend/stores";

export default function LocationRestoreButton({ map }: { map: mapboxgl.Map }) {
  const [contained, setContained] = useState(true);

  const { coordinates } = useLocation();

  function handleClick() {
    if (map.isBusy()) return;

    setContained(true);

    map.disableActions();
    map.off("idle", map.enablePlaygroundActions);
    map.once("idle", map.enablePlaygroundActions);
    map.flyTo({
      center: [coordinates.longitude, coordinates.latitude],
      zoom: VIEW.PLAYGROUND.ZOOM,
      pitch: VIEW.PLAYGROUND.PITCH,
      bearing: VIEW.PLAYGROUND.BEARING,
      duration: VIEW.TRANSITION_DURATION,
    });
  }

  useEffect(
    () => {
      function checkBounds() {
        const { x, y } = map.project([coordinates.longitude, coordinates.latitude]);
        const { clientWidth, clientHeight } = map.getContainer();
        setContained(x >= 0 && x <= clientWidth && y >= 0 && y <= clientHeight);
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
      className="fixed z-[9999] bottom-5 right-5 rounded-md"
      onClick={handleClick}
    >
      <PlayerMarkerImage size="40px" />
    </button>
  );
}
