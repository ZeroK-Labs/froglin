import React, { Dispatch, SetStateAction, useEffect, useState } from "react";

import { LineMenuPopupListItem } from "components/LineMenuPopupListItem";
import { MAP_VIEWS } from "enums";
import { VIEW } from "settings";
import { useTutorialState, useViewState } from "stores";

export function LineMenuPopupList({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const { setTutorial } = useTutorialState();
  const { setView } = useViewState();

  const [currentView, setCurrentView] = useState(MAP_VIEWS.PLAYGROUND);

  function toggleView() {
    if (currentView === MAP_VIEWS.EVENT) {
      setView(MAP_VIEWS.PLAYGROUND);
      setTimeout(
        () => setCurrentView(MAP_VIEWS.PLAYGROUND),
        VIEW.LINE_MENU_ANIMATION_DURATION,
      );
    } else {
      setView(MAP_VIEWS.EVENT);
      setTimeout(
        () => setCurrentView(MAP_VIEWS.EVENT),
        VIEW.LINE_MENU_ANIMATION_DURATION,
      );
    }
  }

  const handleTutorialClick = (ev: MouseEvent | React.BaseSyntheticEvent) => {
    setOpen(false);
    setTutorial(true);
    ev.stopPropagation();
  };

  useEffect(() => {
    if (!open) return;
    const handleKeypress = () => setOpen(false);
    document.addEventListener("keypress", handleKeypress);
    return () => {
      document.removeEventListener("keypress", handleKeypress);
    };
  }, [open]);

  return (
    <nav
      className={`absolute bottom-14 -left-2 p-2 border rounded-md shadow-lg shadow-main-purple/80 bg-gray-800 transition-opacity ${open ? "opacity-90" : "opacity-0 pointer-events-none"}`}
      style={{ transitionDuration: `${VIEW.LINE_MENU_ANIMATION_DURATION}ms` }}
      onClick={() => setOpen(false)}
    >
      <ul>
        <LineMenuPopupListItem
          text={currentView === MAP_VIEWS.EVENT ? "🗺️" : "🌇"}
          onClick={toggleView}
        />
        <LineMenuPopupListItem
          text="📖"
          onClick={handleTutorialClick}
        />
      </ul>
    </nav>
  );
}
