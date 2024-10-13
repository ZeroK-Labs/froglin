import { Dispatch, SetStateAction, useEffect } from "react";

import { MenuPopupListItem } from "./MenuPopupListItem";
import { MAP_VIEWS, MODALS } from "frontend/enums";
import { VIEW } from "frontend/settings";
import { useMapViewState, useModalState, usePlayer } from "frontend/stores";

type Props = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

export function MenuPopupList({ open, setOpen }: Props) {
  const { aztec } = usePlayer();
  const { setModal } = useModalState();
  const { mapView, setMapView } = useMapViewState();

  function handleClose() {
    setOpen(false);
  }

  function toggleView() {
    setTimeout(
      setMapView,
      VIEW.LINE_MENU_FADE_DURATION,
      mapView === MAP_VIEWS.EVENT ? MAP_VIEWS.PLAYGROUND : MAP_VIEWS.EVENT,
    );
  }

  function handleModalChange(modal: MODALS, ev: React.MouseEvent) {
    setOpen(false);
    setModal(modal);
    ev.stopPropagation();
  }

  function handleTutorialClick(ev: React.MouseEvent) {
    handleModalChange(MODALS.TUTORIAL, ev);
  }

  function handleLeaderBoardClick(ev: React.MouseEvent) {
    handleModalChange(MODALS.LEADERBOARD, ev);
  }

  function handleAlbumClick(ev: React.MouseEvent) {
    handleModalChange(MODALS.ALBUM, ev);
  }

  function handleNoticesClick(ev: React.MouseEvent) {
    handleModalChange(MODALS.NOTICEBOARD, ev);
  }

  function handleClaimsClick(ev: React.MouseEvent) {
    handleModalChange(MODALS.CLAIMS, ev);
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
    <div
      className={`absolute bottom-14 -left-2 p-2 border rounded-md shadow-lg shadow-main-purple/80 bg-gray-800 transition-opacity
        ${open ? "opacity-90" : "opacity-0 pointer-events-none"}
        ${aztec ? "min-w-max grid grid-cols-3 grid-rows-2 gap-1" : ""}`}
      style={{
        transitionDuration: `${VIEW.LINE_MENU_FADE_DURATION}ms`,
      }}
      onClick={handleClose}
    >
      <MenuPopupListItem
        text="Tutorial"
        icon="📖"
        onClick={handleTutorialClick}
      />
      {aztec ? (
        <>
          <MenuPopupListItem
            text={mapView === MAP_VIEWS.EVENT ? "Street" : "Bird's eye"}
            icon={mapView === MAP_VIEWS.EVENT ? "🌇" : "🗺️"}
            onClick={toggleView}
          />
          <MenuPopupListItem
            text="Leaderboard"
            icon="🏆"
            onClick={handleLeaderBoardClick}
          />
          <MenuPopupListItem
            text="Album"
            icon="📸"
            onClick={handleAlbumClick}
          />
          <MenuPopupListItem
            text="Noticeboard"
            icon="📰"
            onClick={handleNoticesClick}
          />
          <MenuPopupListItem
            text="Claims"
            icon="🎁"
            onClick={handleClaimsClick}
          />
        </>
      ) : null}
    </div>
  );
}
