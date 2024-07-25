import { EventViewInfoBar, PlaygroundViewInfoBar } from "components";
import { MAP_VIEWS } from "enums";

type Props = {
  view: MAP_VIEWS;
  visible: boolean;
};

export default function InfoBarsContainer({ view, visible }: Props) {
  return (
    <div
      className="fixed z-[9999] left-0 top-2 right-0 p-2 flex pointer-events-none transition-opacity duration-1000"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <PlaygroundViewInfoBar visible={view === MAP_VIEWS.PLAYGROUND} />
      <EventViewInfoBar visible={view === MAP_VIEWS.EVENT} />
    </div>
  );
}
