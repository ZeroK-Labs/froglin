import { Dispatch, SetStateAction, useEffect } from "react";

import { LineMenuPopupListItem } from "components/LineMenuPopupListItem";
import { MAP_VIEWS, MODALS } from "enums";
import { VIEW } from "settings";
import { useMapViewState, useModalState, usePlayer } from "stores";

type Props = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

export function LineMenuPopupList({ open, setOpen }: Props) {
  const player = usePlayer();
  const { setModal } = useModalState();
  const { mapView, setMapView } = useMapViewState();

  function handleClose() {
    setOpen(false);
  }

  function toggleView() {
    setTimeout(
      setMapView,
      VIEW.LINE_MENU_FADE_ANIMATION_DURATION,
      mapView === MAP_VIEWS.EVENT ? MAP_VIEWS.PLAYGROUND : MAP_VIEWS.EVENT,
    );
  }

  function handleTutorialClick(ev: React.MouseEvent) {
    setOpen(false);
    setModal(MODALS.TUTORIAL);
    ev.stopPropagation();
  }

  function handleLeaderBoardClick(ev: React.MouseEvent) {
    setOpen(false);
    setModal(MODALS.LEADERBOARD);
    ev.stopPropagation();
  }

  useEffect(
    () => {
      if (!open) return;

      document.addEventListener("keypress", handleClose);

      return () => {
        document.removeEventListener("keypress", handleClose);
      };
    }, //
    [open],
  );

  return (
    <nav
      className={`absolute bottom-14 -left-2 p-2 border rounded-md shadow-lg shadow-main-purple/80 bg-gray-800 transition-opacity ${open ? "opacity-90" : "opacity-0 pointer-events-none"}`}
      style={{ transitionDuration: `${VIEW.LINE_MENU_FADE_ANIMATION_DURATION}ms` }}
      onClick={handleClose}
    >
      <ul>
        <LineMenuPopupListItem
          text={mapView === MAP_VIEWS.EVENT ? "🌇" : "🗺️"}
          onClick={toggleView}
        />
        <LineMenuPopupListItem
          text="📖"
          onClick={handleTutorialClick}
        />
        {player.aztec ? (
          <LineMenuPopupListItem
            text="🏆"
            onClick={handleLeaderBoardClick}
          />
        ) : null}
      </ul>
    </nav>
  );
}
