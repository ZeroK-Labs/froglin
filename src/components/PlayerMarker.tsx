import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Marker } from "react-map-gl";

import { FROGLIN, PLAYER } from "settings";
import { Froglin, InterestPoint, MapCoordinates } from "types";
import { MAP_VIEWS } from "enums";
import { PlayerMarkerImage, TrapMarkerList } from "components";
import { inRange, inTriangle } from "utils/map";
import { useGameEventState, useRevealingCircleState, useLocation } from "stores";

type Props = {
  view: MAP_VIEWS;
};

function getRandomInRange(a: number, b: number): number {
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export default function PlayerMarker({ view }: Props) {
  const navRef = useRef<HTMLDivElement>(null);
  const revealingRef = useRef(false);

  const [trapPoints, setTrapPoints] = useState<MapCoordinates[]>([]);
  const [duplicateTrapIndex, setDuplicateTrapIndex] = useState<number | null>(null);
  const [open, setOpen] = useState<boolean>(false);

  const { coordinates, lost } = useLocation();
  const { setVisible, setSize } = useRevealingCircleState();
  const {
    interestPoints,
    revealedFroglins,
    setInterestPoints,
    revealFroglins,
    captureFroglins,
  } = useGameEventState();

  const cssMenuButton = `${open ? "" : "opacity-0"} menu-item`;

  function handleMenuStateChange(ev: ChangeEvent<HTMLInputElement>) {
    setOpen(ev.target.checked);
  }

  function doReveal(radius: number = PLAYER.REVEAL.RADIUS) {
    // update the state
    const interestPointsHidden: InterestPoint[] = [];
    const revealedFroglins: Froglin[] = [];

    for (let i = 0; i !== interestPoints.length; ++i) {
      const point = interestPoints[i];

      if (!point.visible || !inRange(point.coordinates, coordinates, radius)) {
        interestPointsHidden.push(point);

        continue;
      }

      // hide the point to start fade out animation
      point.visible = false;
      interestPointsHidden.push(point);

      // send some goblins to the void
      const gone = Math.random();
      if (gone < 0.25 || gone > 0.75) continue;

      revealedFroglins.push({
        id: "R" + point.id,
        coordinates: point.coordinates,
        type: getRandomInRange(2, 7),
      });
    }

    // hide interest points
    setInterestPoints(interestPointsHidden);

    if (revealedFroglins.length === 0) return;

    // delay setting the state for fadeout animation to complete
    setTimeout(revealFroglins, FROGLIN.MARKER.TRANSITION_DURATION, revealedFroglins);
  }

  function handleFluteButtonClick() {
    setOpen(false);

    if (revealingRef.current) return;
    revealingRef.current = true;

    // create animation for circle
    const duration = 1_000;
    const loops = 8;
    const increment = PLAYER.REVEAL.RADIUS / loops;
    let radius = increment;

    setSize(0);
    setVisible(true);

    let i = 1;
    const id = setInterval(
      () => {
        radius += increment;
        setSize(radius);

        doReveal(radius);

        if (++i === loops) clearInterval(id);
      },
      Math.floor(duration / loops),
    );

    setTimeout(() => {
      revealingRef.current = false;
      setVisible(false);
    }, duration + 50);
  }

  function handleTrapButtonClick() {
    setOpen(false);

    if (trapPoints.length === 3) return;

    setDuplicateTrapIndex(null);

    for (let i = 0; i !== trapPoints.length; ++i) {
      const point = trapPoints[i];

      if (
        point.latitude === coordinates.latitude &&
        point.longitude === coordinates.longitude
      ) {
        // allow repeated shows when the same trap is duplicated by
        // changing the state twice: initially to null, then (again) to the (same) index
        setTimeout(setDuplicateTrapIndex, 0, i);

        return;
      }
    }

    setTrapPoints((old) => [...old, { ...coordinates }]);
  }

  useEffect(
    () => {
      for (let i = 0; i !== revealedFroglins.length; ++i) {
        const froglin = revealedFroglins[i];
        if (inRange(froglin.coordinates, coordinates, PLAYER.CAPTURE_RADIUS)) {
          captureFroglins([froglin.id]);
        }
      }
    }, //
    [coordinates.latitude, coordinates.longitude],
  );

  useEffect(
    () => {
      if (trapPoints.length !== 3) return;

      const triangle = trapPoints as [MapCoordinates, MapCoordinates, MapCoordinates];

      const capturedIds: [Froglin["id"]?] = [];
      for (let i = 0; i !== revealedFroglins.length; ++i) {
        const froglin = revealedFroglins[i];
        if (inTriangle(froglin.coordinates, triangle)) capturedIds.push(froglin.id);
      }

      setTimeout(captureFroglins, 0, capturedIds);
      setTimeout(setTrapPoints, FROGLIN.MARKER.TRANSITION_DURATION, []);
    }, //
    [trapPoints, revealedFroglins],
  );

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
