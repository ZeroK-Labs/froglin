import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Marker } from "react-map-gl";

import { FROGLIN, PLAYER } from "settings";
import { Froglin } from "types";
import { MAP_VIEWS } from "enums";
import { MapCoordinates } from "../../common/types";
import { PlayerMarkerImage, TrapMarkerList } from "components";
import { inRange, inTriangle } from "../../common/utils/map";
import { useGameEvent, useRevealingCircleState, useLocation } from "stores";

type Props = {
  view: MAP_VIEWS;
};

export default function PlayerMarker({ view }: Props) {
  const navRef = useRef<HTMLDivElement>(null);
  const revealingRef = useRef(false);

  const [trapPoints, setTrapPoints] = useState<MapCoordinates[]>([]);
  const [duplicateTrapIndex, setDuplicateTrapIndex] = useState<number | null>(null);
  const [open, setOpen] = useState<boolean>(false);

  const { coordinates, lost } = useLocation();
  const { setVisible, setSize } = useRevealingCircleState();
  const { interestPoints, revealedFroglins, revealFroglins, captureFroglins } =
    useGameEvent();

  const cssMenuButton = `${open ? "" : "opacity-0"} menu-item`;

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

    setSize(0);
    setVisible(true);

    let frameIndex = 0;
    const id = setInterval(
      () => {
        // increase circle size
        radius += increment;
        if (frameIndex === 7) radius = PLAYER.REVEAL.RADIUS;
        setSize(radius);

        revealFroglins(radius);

        if (++frameIndex !== loopCount) return;

        setVisible(false);
        clearInterval(id);

        // prevent spamming of reveal
        setTimeout(
          () => {
            revealingRef.current = false;
          }, //
          1_000,
        );
      },
      Math.floor(duration / loopCount),
    );
  }

  function handleTrapButtonClick() {
    setOpen(false);

    if (trapPoints.length === 3) return;

    setDuplicateTrapIndex(null);

    for (let i = 0; i !== trapPoints.length; ++i) {
      const trap = trapPoints[i];

      if (
        trap.latitude === coordinates.latitude &&
        trap.longitude === coordinates.longitude
      ) {
        // allow repeated shows when the same trap is duplicated by
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
      const capturedFroglinIds: Froglin["id"][] = [];
      for (let i = 0; i !== revealedFroglins.length; ++i) {
        const froglin = revealedFroglins[i];

        if (!inRange(froglin.coordinates, coordinates, PLAYER.CAPTURE_RADIUS)) continue;

        froglin.visible = false;
        capturedFroglinIds.push(froglin.id);
      }

      // delay setting the state for fadeout animation to complete
      setTimeout(
        captureFroglins,
        FROGLIN.MARKER.TRANSITION_DURATION,
        capturedFroglinIds,
      );
    }, //
    [coordinates.latitude, coordinates.longitude],
  );

  // capture Froglin on trap placement
  useEffect(
    () => {
      if (trapPoints.length !== 3) return;

      // reset trap points
      setTimeout(setTrapPoints, FROGLIN.MARKER.TRANSITION_DURATION, []);

      // capture Froglins from inside the trap triangle
      const triangle = trapPoints as [MapCoordinates, MapCoordinates, MapCoordinates];

      const capturedFroglinIds: Froglin["id"][] = [];
      for (let i = 0; i !== revealedFroglins.length; ++i) {
        const froglin = revealedFroglins[i];

        if (!inTriangle(froglin.coordinates, triangle)) continue;

        froglin.visible = false;
        capturedFroglinIds.push(froglin.id);
      }

      if (capturedFroglinIds.length === 0) return;

      // delay setting the state for fadeout animation to complete
      setTimeout(
        captureFroglins,
        FROGLIN.MARKER.TRANSITION_DURATION,
        capturedFroglinIds,
      );
    }, //
    [trapPoints, revealedFroglins],
  );

  // key shortcuts for Ring Menu actions
  useEffect(
    () => {
      function handleKeyPress(ev: KeyboardEvent) {
        if (ev.key === "f") handleFluteButtonClick();
        else if (ev.key === " ") handleTrapButtonClick();

        setOpen(false);
      }

      document.addEventListener("keypress", handleKeyPress);

      return () => {
        document.removeEventListener("keypress", handleKeyPress);
      };
    }, //
    [interestPoints, trapPoints, coordinates.latitude, coordinates.longitude],
  );

  // close Ring Menu when clicking outside its bounds
  useEffect(
    () => {
      function handleDocumentClick(ev: MouseEvent) {
        if (navRef.current && navRef.current.contains(ev.target as Node)) return;

        setOpen(false);
      }

      document.addEventListener("click", handleDocumentClick);

      return () => {
        document.removeEventListener("click", handleDocumentClick);
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
            {...(view === MAP_VIEWS.PLAYGROUND ? { htmlFor: "menu-options" } : null)}
          >
            <div
              className={`absolute -top-4 px-2 text-xs leading-5 whitespace-nowrap bg-main-purple text-white transition-opacity duration-500 ${open ? "opacity-0" : ""}`}
            >
              Jules Verne
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
