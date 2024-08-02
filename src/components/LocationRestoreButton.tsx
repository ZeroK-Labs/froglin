import { useEffect, useState } from "react";

import { PlayerMarkerImage } from "src/components";
import { VIEW } from "src/settings";
import { useLocation } from "src/stores";

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
      duration: VIEW.VIEW_ANIMATION_DURATION,
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
      className="fixed z-[9999] bottom-5 right-5 rounded-md"
      onClick={handleClick}
    >
      <PlayerMarkerImage size="40px" />
    </button>
  );
}
