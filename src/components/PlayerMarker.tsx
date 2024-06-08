import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Marker } from "react-map-gl";
import MapCoordinates from "types/MapCoordinates";

type Props = {
  location: MapCoordinates;
  handleFlute: () => void;
  handleCapture: () => void;
};

export default function PlayerMarker({
  location,
  handleCapture,
  handleFlute,
}: Props) {
  const [open, setOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const cssMenuButton = `${open ? "" : "opacity-0"} menu-item`;

  function handleChange(ev: ChangeEvent<HTMLInputElement>) {
    setOpen(ev.target.checked);
  }

  function handleDocumentClick(event: MouseEvent) {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setOpen(false);
    }
  }

  useEffect(() => {
    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  if (!location) return null;

  return (
    <Marker
      longitude={location.longitude}
      latitude={location.latitude}
    >
      <div
        ref={menuRef}
        className="h-[40px] rounded-full flex justify-center z-[9999]"
      >
        <nav className="menu">
          <input
            id="menu-options"
            type="checkbox"
            checked={open}
            className="menu-options hidden"
            onChange={handleChange}
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
            <img
              className="relative self-center rounded-full border-gray-800 border-solid border-2"
              src="/images/profilePic.webp"
              width="60px"
              height="60px"
              alt=""
            />
          </label>

          <div className={`${cssMenuButton} blue`}>
            <p className="fa-solid fa-hat-wizard text-[36px]" />
          </div>
          <div
            className={`${cssMenuButton} green`}
            onClick={() => {
              handleFlute();
              setOpen(false);
            }}
          >
            <p className="fa-brands fa-pied-piper-alt text-[46px] rotate-[50deg]" />
          </div>
          <div
            className={`${cssMenuButton} red`}
            onClick={() => {
              handleCapture();
              setOpen(false);
            }}
          >
            <p className="fa-solid fa-hand-sparkles text-[34px] rotate-[15deg]" />
          </div>
          <div className={`${cssMenuButton} purple`}>
            <p className=" fa-solid fa-mosquito-net text-[42px] rotate-[-15deg]" />
          </div>
          <div className={`${cssMenuButton} orange`}>
            <p className="fa-solid fa-shoe-prints text-[28px] rotate-[290deg]" />
          </div>
        </nav>
      </div>
    </Marker>
  );
}
