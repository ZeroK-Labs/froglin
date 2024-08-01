import { EventViewInfoBar, PlaygroundViewInfoBar } from "components";
import { MAP_VIEWS, MODALS } from "enums";
import { useMapViewState, useModalState } from "stores";

export default function InfoBarsContainer() {
  const { mapView } = useMapViewState();
  const { modal } = useModalState();

  return (
    <div
      className="fixed z-[9999] left-0 top-2 right-0 p-2 flex pointer-events-none transition-opacity duration-1000"
      style={{
        opacity: modal !== MODALS.TUTORIAL && modal !== MODALS.LEADERBOARD ? 1 : 0,
      }}
    >
      <PlaygroundViewInfoBar visible={mapView === MAP_VIEWS.PLAYGROUND} />
      <EventViewInfoBar visible={mapView === MAP_VIEWS.EVENT} />
    </div>
  );
}
