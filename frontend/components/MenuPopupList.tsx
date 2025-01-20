import { Dispatch, SetStateAction, useEffect, useState } from "react";

import { MAP_VIEWS, MODALS } from "frontend/enums";
import { MenuPopupListItem } from "./MenuPopupListItem";
import { VIEW } from "frontend/settings";
import { useMapViewState, useModalState, usePlayer } from "frontend/stores";

type Props = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

export function MenuPopupList({ open, setOpen }: Props) {
  const [viewMenuOpen, setViewMenuOpen] = useState(false);

  const { aztec } = usePlayer();
  const { setModal } = useModalState();
  const { setMapView } = useMapViewState();

  function handleClose() {
    setOpen(false);
    setViewMenuOpen(false);
  }

  function handleViewSelect(view: MAP_VIEWS, ev: React.MouseEvent) {
    setMapView(view);
    handleClose();

    ev.stopPropagation();
  }

  function handleMapViewsClick(ev: React.MouseEvent) {
    setViewMenuOpen((prev) => !prev);

    ev.stopPropagation();
  }

  function handleStreetViewClick(ev: React.MouseEvent) {
    handleViewSelect(MAP_VIEWS.PLAYGROUND, ev);
  }

  function handleEventViewClick(ev: React.MouseEvent) {
    handleViewSelect(MAP_VIEWS.EVENT, ev);
  }

  function handleWorldViewClick(ev: React.MouseEvent) {
    handleViewSelect(MAP_VIEWS.WORLD, ev);
  }

  function handleModalChange(modal: MODALS, ev: React.MouseEvent) {
    setModal(modal);
    handleClose();

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
      if (!open) {
        setViewMenuOpen(false);

        return;
      }

      document.addEventListener("keypress", handleClose);

      return () => {
        document.removeEventListener("keypress", handleClose);
      };
    }, //
    [open],
  );

  return (
    <div
      className={`z-[999999] absolute bottom-14 -left-2 p-2 border rounded-md shadow-lg shadow-main-purple/80 bg-gray-800 transition-opacity
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
            text="Map View"
            icon="🗺️"
            onClick={handleMapViewsClick}
          />
          {viewMenuOpen && (
            <div
              className="absolute left-1/2 -translate-x-1/2 p-2 border border-purple-800 rounded-md shadow-lg shadow-main-purple/80 bg-gray-800 opacity-85 flex gap-4"
              style={{ top: "-6.4rem" }}
            >
              <MenuPopupListItem
                text="Street"
                icon="🌇"
                onClick={handleStreetViewClick}
              />
              <MenuPopupListItem
                text="Bird's Eye"
                icon="🦅"
                onClick={handleEventViewClick}
              />
              <MenuPopupListItem
                text="World"
                icon="🌍"
                onClick={handleWorldViewClick}
              />
            </div>
          )}
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
