import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Marker } from "react-map-gl";

import type { Froglin } from "frontend/types";
import type { MapCoordinates } from "common/types";
import { FROGLIN, PLAYER } from "frontend/settings";
import { MAP_VIEWS } from "frontend/enums";
import { PlayerMarkerImage, TrapMarkerList } from "frontend/components";
import { inRange, inTriangle } from "common/utils/map";
import {
  useGameEvent,
  useLocation,
  useMapViewState,
  usePlayer,
  useRevealingCircleState,
} from "frontend/stores";
import {
  addKeyboardShortcut,
  removeKeyboardShortcut,
} from "frontend/utils/KeyboardShortcuts";

export default function PlayerMarker() {
  const navRef = useRef<HTMLDivElement>(null);
  const revealingRef = useRef(false);
  const capturingRef = useRef(false);

  const [trapPoints, setTrapPoints] = useState<MapCoordinates[]>([]);
  const [duplicateTrapIndex, setDuplicateTrapIndex] = useState<number | null>(null);
  const [open, setOpen] = useState<boolean>(false);

  const { username, registered } = usePlayer();
  const { revealedFroglins, revealFroglins, capturing, captureFroglins } =
    useGameEvent();
  const { coordinates, lost } = useLocation();
  const { mapView } = useMapViewState();
  const { setVisible, setSize } = useRevealingCircleState();

  const cssMenuButton = `${open ? "" : "opacity-0"} menu-item`;

  capturingRef.current = capturing;

  function handleMenuStateChange(ev: ChangeEvent<HTMLInputElement>) {
    setOpen(ev.target.checked);
  }

  function handleFluteButtonClick() {
    setOpen(false);

    // prevent spamming of reveal
    if (revealingRef.current) return;
    revealingRef.current = true;

    // create animation for circle
    const duration = 1_000;
    const loopCount = 8;
    const increment = PLAYER.REVEAL.RADIUS / loopCount;
    let radius = increment;
    let frameIndex = 0;
    let intervalId: Timer;

    function animateFrame() {
      radius += increment;
      if (frameIndex === 7) radius = PLAYER.REVEAL.RADIUS;
      setSize(radius);

      revealFroglins(radius);

      if (++frameIndex !== loopCount) return;

      setVisible(false);
      clearInterval(intervalId);

      // prevent spamming of reveal
      setTimeout(
        () => {
          revealingRef.current = false;
        }, //
        1_000,
      );
    }

    setSize(0);
    setVisible(true);
    intervalId = setInterval(animateFrame, Math.floor(duration / loopCount));
  }

  function handleTrapButtonClick() {
    if (capturingRef.current) return;

    setOpen(false);

    if (trapPoints.length === 3) return;

    setDuplicateTrapIndex(null);

    for (let i = 0; i !== trapPoints.length; ++i) {
      const trap = trapPoints[i];

      if (
        trap.latitude === coordinates.latitude &&
        trap.longitude === coordinates.longitude
      ) {
        // allow repeated shows of information message when the same trap is duplicated by
        // changing the state twice: initially to null, then (again) to the (same) index
        setTimeout(setDuplicateTrapIndex, 0, i);

        return;
      }
    }

    setTrapPoints((old) => [...old, { ...coordinates }]);
  }

  // capture Froglin on location change
  useEffect(
    () => {
      if (capturingRef.current) return;

      const froglinIds: Froglin["id"][] = [];
      for (let i = 0; i !== revealedFroglins.length; ++i) {
        const froglin = revealedFroglins[i];
        if (
          froglin.visible &&
          inRange(froglin.coordinates, coordinates, PLAYER.CAPTURE_RADIUS)
        ) {
          froglinIds.push(froglin.id);
        }
      }

      if (froglinIds.length !== 0) captureFroglins(froglinIds);
    }, //
    [coordinates.latitude, coordinates.longitude],
  );

  // capture Froglin on trap placement
  useEffect(
    () => {
      if (capturingRef.current || trapPoints.length !== 3) return;

      // reset trap points
      setTimeout(setTrapPoints, FROGLIN.MARKER.TRANSITION_DURATION, []);

      // capture Froglins from inside the trap triangle
      const triangle = trapPoints as [MapCoordinates, MapCoordinates, MapCoordinates];

      const froglinIds: Froglin["id"][] = [];
      for (let i = 0; i !== revealedFroglins.length; ++i) {
        const froglin = revealedFroglins[i];
        if (froglin.visible && inTriangle(froglin.coordinates, triangle)) {
          froglinIds.push(froglin.id);
        }
      }

      if (froglinIds.length !== 0) captureFroglins(froglinIds);
    }, //
    [trapPoints],
  );

  // Ring Menu keyboard actions
  useEffect(
    () => {
      function handleKeyPress(ev: KeyboardEvent) {
        setOpen(false);

        if (ev.key === "f") handleFluteButtonClick();
        else if (ev.key === " ") handleTrapButtonClick();
      }

      addKeyboardShortcut(handleKeyPress);

      return () => {
        removeKeyboardShortcut(handleKeyPress);
      };
    }, //
    // TODO: need all below for trap to work correctly using keys
    [trapPoints, coordinates.longitude, coordinates.latitude],
  );

  // Ring Menu mouse actions
  useEffect(
    () => {
      function handleClick(ev: MouseEvent) {
        if (navRef.current && navRef.current.contains(ev.target as Node)) return;

        setOpen(false);
      }

      document.addEventListener("click", handleClick);

      return () => {
        document.removeEventListener("click", handleClick);
      };
    }, //
    [],
  );

  return (
    <>
      <Marker
        longitude={coordinates.longitude}
        latitude={coordinates.latitude}
        style={{ zIndex: 9999 }}
      >
        <nav
          ref={navRef}
          className="menu -translate-y-10 translate-x-[14px]"
        >
          <input
            id="menu-options"
            type="checkbox"
            checked={open}
            className="menu-options hidden"
            onChange={handleMenuStateChange}
          />
          <label
            {...(mapView === MAP_VIEWS.PLAYGROUND ? { htmlFor: "menu-options" } : null)}
          >
            <div
              className={`absolute -top-4 px-2 text-xs leading-5 whitespace-nowrap bg-main-purple text-white transition-opacity duration-500 ${open ? "opacity-0" : ""}`}
            >
              {registered && username ? username : "Jules Verne"}
            </div>
            <PlayerMarkerImage
              size="60px"
              grayscale={lost}
            />
          </label>

          <div className={`${cssMenuButton} menu-disabled`}>
            <p className="fa-solid fa-hat-wizard text-[36px] translate-y-[2px]" />
          </div>
          <div
            className={`${cssMenuButton} green ${open ? "" : "pointer-events-none"}`}
            onClick={handleFluteButtonClick}
          >
            <p className="fa-brands fa-pied-piper-alt text-[42px] rotate-[50deg]" />
          </div>
          <div className={`${cssMenuButton} menu-disabled`}>
            <p className="fa-solid fa-hand-sparkles text-[30px] rotate-[15deg]" />
          </div>
          <div
            className={`${cssMenuButton} purple ${open ? "" : "pointer-events-none"}`}
            onClick={handleTrapButtonClick}
          >
            <p className=" fa-solid fa-circle-nodes text-[36px] -translate-x-[1px] translate-y-[6px]" />
          </div>
          <div className={`${cssMenuButton} menu-disabled`}>
            <p className="fa-solid fa-shoe-prints text-[24px] rotate-[290deg] -translate-x-[1px]" />
          </div>
        </nav>
      </Marker>

      <TrapMarkerList
        traps={trapPoints}
        duplicateIndex={duplicateTrapIndex}
      />
    </>
  );
}
