import { LineMenuPopupListItem } from "components/LineMenuPopupListItem";
import { MAP_VIEWS } from "enums";

const duration = 300;

export function LineMenuPopupList({
  open,
  setOpen,
  view,
  setView,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  view: MAP_VIEWS;
  setView: React.Dispatch<React.SetStateAction<MAP_VIEWS>>;
}) {
  function handleButtonEventViewClick() {
    setOpen(false);
    setTimeout(() => setView(MAP_VIEWS.EVENT), duration);
  }

  function handleButtonPlaygroundViewClick() {
    setOpen(false);
    setTimeout(() => setView(MAP_VIEWS.PLAYGROUND), duration);
  }

  function handleButtonProfileModalClick() {
    setOpen(false);
  }

  return (
    <nav
      className={`absolute bottom-16 -left-2 p-2 border rounded-md shadow-lg shadow-main-purple/80 bg-gray-800 transition-opacity ${open ? "opacity-90" : "opacity-0 pointer-events-none"}`}
      style={{ transitionDuration: `${duration}ms` }}
    >
      <ul>
        {view === MAP_VIEWS.PLAYGROUND ? (
          <LineMenuPopupListItem
            text="🗺️"
            onClick={handleButtonEventViewClick}
          />
        ) : view === MAP_VIEWS.EVENT ? (
          <LineMenuPopupListItem
            text="🌇"
            onClick={handleButtonPlaygroundViewClick}
          />
        ) : null}

        <LineMenuPopupListItem
          text="👤"
          onClick={handleButtonProfileModalClick}
        />
      </ul>
    </nav>
  );
}
