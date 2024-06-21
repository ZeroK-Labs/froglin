import { EventViewInfoBar, PlaygroundViewInfoBar } from "components";
import { MAP_VIEWS } from "enums";

type Props = {
  distance?: number;
  view: MAP_VIEWS;
  visible: boolean;
};

export default function InfoBarsContainer({ distance = 0, view, visible }: Props) {
  return (
    <div
      className="absolute left-0 top-2 right-0 p-2 flex pointer-events-none transition-opacity duration-1000"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <PlaygroundViewInfoBar
        visible={view === MAP_VIEWS.PLAYGROUND}
        distance={distance}
      />
      <EventViewInfoBar visible={view === MAP_VIEWS.EVENT} />
    </div>
  );
}
