import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Marker } from "react-map-gl";

import { Froglin, MapCoordinates } from "types";
import { MAP_VIEWS } from "enums";
import { PlayerMarkerImage } from "components";
import { inRange } from "utils/map";
import { useCircleIndicatorProps } from "providers/CircleIndicatorProps";
import { MAP_VIEWS } from "enums";

type Props = {
  location: MapCoordinates;
  dormantFroglins: MapCoordinates[];
  revealedFroglins: Froglin[];
  view: MAP_VIEWS;
  updateRevealed: (
    revealedFroglins: Froglin[],
    remainingFroglins: MapCoordinates[],
  ) => void;
  updateCaught: (froglinId: number) => void;
  view: MAP_VIEWS;
};

const REVEAL_RADIUS = 40;
const CAPTURE_RADIUS = 5;

function getRandomInRange(a: number, b: number): number {
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function sign(p1: MapCoordinates, p2: MapCoordinates, p3: MapCoordinates) {
  return (
    (p1.longitude - p3.longitude) * (p2.latitude - p3.latitude) -
    (p2.longitude - p3.longitude) * (p1.latitude - p3.latitude)
  );
}

function pointInTriangle(
  pt: MapCoordinates,
  v1: MapCoordinates,
  v2: MapCoordinates,
  v3: MapCoordinates,
) {
  let d1, d2, d3;
  let has_neg, has_pos;

  d1 = sign(pt, v1, v2);
  d2 = sign(pt, v2, v3);
  d3 = sign(pt, v3, v1);

  has_neg = d1 < 0 || d2 < 0 || d3 < 0;
  has_pos = d1 > 0 || d2 > 0 || d3 > 0;

  return !(has_neg && has_pos);
}

export default function PlayerMarker(props: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const revealingRef = useRef(false);
  const [trapPoints, setTrapPoints] = useState<MapCoordinates[]>([]);
  const [open, setOpen] = useState<boolean>(false);

  const { setVisible, setSize, setColor } = useCircleIndicatorProps();

  const cssMenuButton = `${open ? "" : "opacity-0"} menu-item`;

  function handleMenuStateChange(ev: ChangeEvent<HTMLInputElement>) {
    setOpen(ev.target.checked);
  }

  function doReveal() {
    const remainingFroglins: MapCoordinates[] = [];
    const revealedFroglins: Froglin[] = [];

    for (let i = 0; i !== props.dormantFroglins.length; ++i) {
      const coords = props.dormantFroglins[i];
      if (inRange(coords, props.location, REVEAL_RADIUS)) {
        // send some goblins to the void
        const coeff = Math.random();
        if (coeff < 0.3 || coeff > 0.75) continue;
        else
          revealedFroglins.push({
            id: Date.now() + revealedFroglins.length,
            coordinates: coords,
            type: getRandomInRange(2, 7),
          });
      } //
      else remainingFroglins.push(coords);
    }

    revealingRef.current = false;

    if (revealedFroglins.length === 0) return;

    props.updateRevealed(revealedFroglins, remainingFroglins);
  }

  function handleFluteButtonClick() {
    setOpen(false);

    if (revealingRef.current) return;
    revealingRef.current = true;

    const duration = 1_000;
    const increment = 8;
    const loops = 5;
    let radius = 0;

    setSize(radius);
    setVisible(true);
    setColor("green");

    let i = 0;
    const id = setInterval(
      () => {
        radius += increment;
        setSize(radius);
        if (++i === loops) clearInterval(id);
      },
      Math.floor(duration / loops),
    );

    setTimeout(() => {
      setVisible(false);
    }, duration + 100);

    setTimeout(doReveal, duration);
  }

  function handleTrapButtonClick() {
    setOpen(false);

    if (trapPoints.length === 3) return;

    setTrapPoints((oldTrapPoints) => {
      const newTrapPoints = [...oldTrapPoints, { ...props.location }];
      if (newTrapPoints.length !== 3) return newTrapPoints;

      for (let i = 0; i !== props.revealedFroglins.length; ++i) {
        const froglin = props.revealedFroglins[i];
        if (
          pointInTriangle(
            froglin.coordinates,
            newTrapPoints[0],
            newTrapPoints[1],
            newTrapPoints[2],
          )
        ) {
          setTimeout(() => {
            props.updateCaught(froglin.id);
          }, 0);
        }
      }

      setTimeout(() => {
        setTrapPoints([]);
      }, 500);

      return newTrapPoints;
    });
  }

  useEffect(() => {
    for (let i = 0; i !== props.revealedFroglins.length; ++i) {
      const froglin = props.revealedFroglins[i];
      if (inRange(froglin.coordinates, props.location, CAPTURE_RADIUS)) {
        props.updateCaught(froglin.id);
        break;
      }
    }
  }, [props.location.latitude, props.location.longitude]);

  useEffect(() => {
    function handleKeyPress(ev: KeyboardEvent) {
      if (ev.key === "f") handleFluteButtonClick();
    }

    document.addEventListener("keypress", handleKeyPress);

    return () => {
      document.removeEventListener("keypress", handleKeyPress);
    };
  }, [props.dormantFroglins]);

  useEffect(() => {
    function handleDocumentClick(ev: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(ev.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("click", handleDocumentClick);

    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  if (!props.location) return null;

  return (
    <>
      <Marker
        longitude={props.location.longitude}
        latitude={props.location.latitude}
        style={{ zIndex: 9999 }}
      >
        <nav
          ref={menuRef}
          className={`menu -translate-y-10 translate-x-[14px] z-[9999] `}
        >
          <input
            id="menu-options"
            type="checkbox"
            checked={open}
            className="menu-options hidden"
            onChange={handleMenuStateChange}
          />
          <label
            {...(props.view === MAP_VIEWS.PLAYGROUND
              ? { htmlFor: "menu-options" }
              : null)}
          >
            <div
              className={`absolute -top-4 px-2 text-xs leading-5 whitespace-nowrap bg-main-purple text-white transition-opacity duration-500 ${open ? "opacity-0" : ""}`}
            >
              Jules Verne
            </div>
            <PlayerMarkerImage size="60px" />
          </label>
          {props.view === MAP_VIEWS.PLAYGROUND ? (
            <>
              <div className={`${cssMenuButton} menu-disabled`}>
                <p className="fa-solid fa-hat-wizard text-[36px]" />
              </div>
              <div
                className={`${cssMenuButton} green ${open ? "" : "pointer-events-none"}`}
                onClick={handleFluteButtonClick}
              >
                <p className="fa-brands fa-pied-piper-alt text-[46px] rotate-[50deg]" />
              </div>
              <div className={`${cssMenuButton} menu-disabled`}>
                <p className="fa-solid fa-hand-sparkles text-[34px] rotate-[15deg]" />
              </div>
              <div
                className={`${cssMenuButton} purple ${open ? "" : "pointer-events-none"}`}
                onClick={handleTrapButtonClick}
              >
                <p className=" fa-solid fa-circle-nodes text-[42px] rotate-[-15deg] -translate-x-[1px] translate-y-[7px]" />
              </div>
              <div className={`${cssMenuButton} menu-disabled`}>
                <p className="fa-solid fa-shoe-prints text-[28px] rotate-[290deg] -translate-x-[1px]" />
              </div>
            </>
          ) : null}
        </nav>
      </Marker>

      {trapPoints.map((location, index) => (
        <Marker
          key={index}
          longitude={location.longitude}
          latitude={location.latitude}
          style={{ zIndex: 9999 }}
        >
          <div
            className={`text-lg px-3 py-1 whitespace-nowrap rounded-lg bg-main-purple text-white`}
          >
            X
          </div>
        </Marker>
      ))}
    </>
  );
}
