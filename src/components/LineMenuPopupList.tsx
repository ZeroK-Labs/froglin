import React, { Dispatch, SetStateAction, useEffect } from "react";

import { LineMenuPopupListItem } from "components/LineMenuPopupListItem";
import { MAP_VIEWS } from "enums";
import { VIEW } from "settings";

type Props = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  setTutorial: Dispatch<SetStateAction<boolean>>;
  view: MAP_VIEWS;
  setView: Dispatch<SetStateAction<MAP_VIEWS>>;
};

export function LineMenuPopupList({
  open,
  setOpen,
  setTutorial,
  view,
  setView,
}: Props) {
  function handleNavClick() {
    setOpen(false);
  }

  function toggleView() {
    setTimeout(
      setView,
      VIEW.LINE_MENU_FADE_ANIMATION_DURATION,
      view === MAP_VIEWS.EVENT ? MAP_VIEWS.PLAYGROUND : MAP_VIEWS.EVENT,
    );
  }

  function handleTutorialClick(ev: MouseEvent | React.BaseSyntheticEvent) {
    setOpen(false);
    setTutorial(true);
    ev.stopPropagation();
  }

  useEffect(
    () => {
      if (!open) return;

      function handleKeypress() {
        setOpen(false);
      }

      document.addEventListener("keypress", handleKeypress);

      return () => {
        document.removeEventListener("keypress", handleKeypress);
      };
    }, //
    [open],
  );

  return (
    <nav
      className={`absolute bottom-14 -left-2 p-2 border rounded-md shadow-lg shadow-main-purple/80 bg-gray-800 transition-opacity ${open ? "opacity-90" : "opacity-0 pointer-events-none"}`}
      style={{ transitionDuration: `${VIEW.LINE_MENU_FADE_ANIMATION_DURATION}ms` }}
      onClick={handleNavClick}
    >
      <ul>
        <LineMenuPopupListItem
          text={view === MAP_VIEWS.EVENT ? "🗺️" : "🌇"}
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
