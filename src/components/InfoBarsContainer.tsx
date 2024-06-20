import { EventViewInfoBar, PlaygroundViewInfoBar } from "components";
import { MAP_VIEWS } from "enums";
import { useTutorialState, useViewState } from "stores";

export default function InfoBarsContainer({ distance = 0 }: { distance?: number }) {
  const { view } = useViewState();
  const { tutorial } = useTutorialState();

  return (
    <div className="absolute left-0 top-2 right-0 p-2 flex pointer-events-none">
      <PlaygroundViewInfoBar
        visible={!tutorial && view === MAP_VIEWS.PLAYGROUND}
        distance={distance}
      />
      <EventViewInfoBar visible={!tutorial && view === MAP_VIEWS.EVENT} />
    </div>
  );
}
