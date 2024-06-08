import { MAP_VIEWS } from "enums";

function MenuButtonElement({
  text,
  onClick,
}: {
  text: string;
  onClick: React.MouseEventHandler;
}) {
  return (
    <li>
      <button
        className="p-4 text-4xl hover:bg-main-purple"
        onClick={onClick}
      >
        {text}
      </button>
    </li>
  );
}

export function ButtonsPopup({
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
    setView(MAP_VIEWS.EVENT);
  }

  function handleButtonPlaygroundViewClick() {
    setOpen(false);
    setView(MAP_VIEWS.PLAYGROUND);
  }

  function handleButtonProfileModalClick() {
    setOpen(false);
  }

  return (
    <nav
      className={`absolute bottom-16 -left-2 p-2 border rounded-md shadow-lg bg-gray-800 transition-opacity duration-300 ${open ? "opacity-90" : "opacity-0 pointer-events-none"}`}
    >
      <ul>
        {view === MAP_VIEWS.PLAYGROUND ? (
          <MenuButtonElement
            text="🗺️"
            onClick={handleButtonEventViewClick}
          />
        ) : null}

        {view === MAP_VIEWS.EVENT ? (
          <MenuButtonElement
            text="🌇"
            onClick={handleButtonPlaygroundViewClick}
          />
        ) : null}

        <MenuButtonElement
          text="👤"
          onClick={handleButtonProfileModalClick}
        />
      </ul>
    </nav>
  );
}
