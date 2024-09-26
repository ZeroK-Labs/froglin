import { EventViewInfoBar, PlaygroundViewInfoBar } from "frontend/components";
import { MAP_VIEWS, MODALS } from "frontend/enums";
import { useMapViewState, useModalState } from "frontend/stores";

export default function InfoBarsContainer() {
  const { mapView } = useMapViewState();
  const { modal } = useModalState();

  return (
    <div
      className="fixed z-[9999] left-0 top-2 right-0 p-2 flex pointer-events-none transition-opacity duration-1000"
      style={{
        opacity: ![
          MODALS.TUTORIAL,
          MODALS.LEADERBOARD,
          MODALS.ALBUM,
          MODALS.FROGLIN_MENU,
          MODALS.BATTLE,
          MODALS.SWAP,
          MODALS.DATE,
          MODALS.NOTICES,
        ].includes(modal)
          ? 1
          : 0,
      }}
    >
      <PlaygroundViewInfoBar visible={mapView === MAP_VIEWS.PLAYGROUND} />
      <EventViewInfoBar visible={mapView === MAP_VIEWS.EVENT} />
    </div>
  );
}
