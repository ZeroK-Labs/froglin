import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

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
  const navRef = useRef<HTMLDivElement>(null);

  const [ViewButton, setViewButton] = useState(() => EventViewButton);

  const { setTutorial } = useTutorialState();
  const { setView } = useViewState();

  function handleClick() {
    setOpen(false);
  }

  function PlaygroundViewButton() {
    return (
      <LineMenuPopupListItem
        text="🌇"
        onClick={() => {
          setView(MAP_VIEWS.PLAYGROUND);
          setTimeout(
            setViewButton,
            VIEW.LINE_MENU_ANIMATION_DURATION,
            () => EventViewButton,
          );
        }}
      />
    );
  }

  function EventViewButton() {
    return (
      <LineMenuPopupListItem
        text="🗺️"
        onClick={() => {
          setView(MAP_VIEWS.EVENT);
          setTimeout(
            setViewButton,
            VIEW.LINE_MENU_ANIMATION_DURATION,
            () => PlaygroundViewButton,
          );
        }}
      />
    );
  }

  function TutorialButton() {
    return (
      <LineMenuPopupListItem
        text="📖"
        onClick={(ev: MouseEvent | React.BaseSyntheticEvent) => {
          setOpen(false);
          setTutorial(true);

          ev.stopPropagation();
        }}
      />
    );
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
      ref={navRef}
      className={`absolute bottom-14 -left-2 p-2 border rounded-md shadow-lg shadow-main-purple/80 bg-gray-800 transition-opacity ${open ? "opacity-90" : "opacity-0 pointer-events-none"}`}
      style={{ transitionDuration: `${VIEW.LINE_MENU_ANIMATION_DURATION}ms` }}
      onClick={handleClick}
    >
      <ul>
        <ViewButton />
        <TutorialButton />
      </ul>
    </nav>
  );
}
