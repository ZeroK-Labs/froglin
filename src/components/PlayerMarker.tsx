import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Marker } from "react-map-gl";

import { AvatarImage } from "components";
import { MapCoordinates, Froglin } from "types";
import { inRange } from "utils";

type Props = {
  location: MapCoordinates;
  dormantFroglins: MapCoordinates[];
  revealedFroglins: Froglin[];
  updateRevealed: (
    revealedFroglins: Froglin[],
    remainingFroglins: MapCoordinates[],
  ) => void;
  updateCaught: (froglin: Froglin, index: number) => void;
};

const REVEAL_RADIUS = 50;
const CAPTURE_RADIUS = 2;

function getRandomInRange(a: number, b: number): number {
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export default function PlayerMarker(props: Props) {
  const [open, setOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const cssMenuButton = `${open ? "" : "opacity-0"} menu-item`;

  function handleMenuStateChange(ev: ChangeEvent<HTMLInputElement>) {
    setOpen(ev.target.checked);
  }

  function handleDocumentClick(event: MouseEvent) {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setOpen(false);
    }
  }

  function handleFlute() {
    setOpen(false);

    const remainingFroglins: MapCoordinates[] = [];
    const revealedFroglins: Froglin[] = [];

    for (let i = 0; i !== props.dormantFroglins.length; ++i) {
      const coords = props.dormantFroglins[i];
      if (!inRange(coords, props.location, REVEAL_RADIUS)) {
        remainingFroglins.push(coords);
      } //
      else if (Math.random() < 0.7) continue;
      else
        revealedFroglins.push({
          coordinates: coords,
          type: getRandomInRange(2, 7),
          revealed: true,
          captured: false,
        });
    }

    if (revealedFroglins.length === 0) return;

    props.updateRevealed(revealedFroglins, remainingFroglins);
  }

  useEffect(() => {
    console.log("chasing");
    for (let i = 0; i !== props.revealedFroglins.length; ++i) {
      const coords = props.revealedFroglins[i].coordinates;
      if (!inRange(coords, props.location, CAPTURE_RADIUS)) continue;
      const froglin = props.revealedFroglins[i];
      console.log("caught");
      props.updateCaught(froglin, i);
      break;
    }
  }, [props.location.latitude, props.location.longitude]);

  useEffect(() => {
    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  if (!props.location) return null;

  return (
    <Marker
      longitude={props.location.longitude}
      latitude={props.location.latitude}
    >
      <div
        ref={menuRef}
        className="h-[40px] -translate-y-3 rounded-full flex justify-center z-[9999]"
      >
        <nav className="menu">
          <input
            id="menu-options"
            type="checkbox"
            checked={open}
            className="menu-options hidden"
            onChange={handleMenuStateChange}
            // @ts-ignore
            href="#"
          />
          <label
            className="flex justify-center"
            htmlFor="menu-options"
          >
            <div
              className={`absolute -top-4 px-2 text-xs leading-5 whitespace-nowrap bg-main-purple text-white transition-opacity duration-500 ${open ? "opacity-0" : ""}`}
            >
              Jules Verne
            </div>
            <AvatarImage size="60px" />
          </label>

          <div className={`${cssMenuButton} blue`}>
            <p className="fa-solid fa-hat-wizard text-[36px]" />
          </div>
          <div
            className={`${cssMenuButton} green`}
            onClick={handleFlute}
          >
            <p className="fa-brands fa-pied-piper-alt text-[46px] rotate-[50deg]" />
          </div>
          <div className={`${cssMenuButton} gray pointer-events-none`}>
            <p className="fa-solid fa-hand-sparkles text-[34px] rotate-[15deg] " />
          </div>
          <div className={`${cssMenuButton} gray pointer-events-none`}>
            <p className=" fa-solid fa-mosquito-net text-[42px] rotate-[-15deg]e" />
          </div>
          <div className={`${cssMenuButton} gray pointer-events-none`}>
            <p className="fa-solid fa-shoe-prints text-[28px] rotate-[290deg]" />
          </div>
        </nav>
      </div>
    </Marker>
  );
}
