import { useEffect, useRef, useState } from "react";

import { MapCoordinates } from "types";

type Keys = {
  w: boolean;
  s: boolean;
  a: boolean;
  d: boolean;
  ArrowUp: boolean;
  ArrowLeft: boolean;
  ArrowDown: boolean;
  ArrowRight: boolean;
};

const options = {
  enableHighAccuracy: false,
  maximumAge: 0,
  timeout: 10_000,
};

const offset = 0.00003; // ~ 1m

export default function useKeyboardLocation() {
  const [current, setCurrent] = useState<MapCoordinates | null>(null);
  const initialRef = useRef<MapCoordinates | null>(null);
  const currentRef = useRef<MapCoordinates | null>(null);
  const keysRef = useRef<Keys>({
    w: false,
    s: false,
    a: false,
    d: false,
    ArrowUp: false,
    ArrowLeft: false,
    ArrowDown: false,
    ArrowRight: false,
  });

  useEffect(() => {
    function handleKeydown(ev: KeyboardEvent) {
      // @ts-ignore
      keysRef.current[ev.key] = true;

      if (ev.key.includes("Arrow")) ev.stopPropagation();
    }

    function handleKeyup(ev: KeyboardEvent) {
      // @ts-ignore
      keysRef.current[ev.key] = false;
    }

    function poll() {
      if (keysRef.current.w === true) {
        currentRef.current!.latitude += offset;
      } else if (keysRef.current.ArrowUp === true) {
        currentRef.current!.latitude += offset;
        console.log(1);
      }

      if (keysRef.current.a === true) {
        currentRef.current!.longitude -= offset;
      } else if (keysRef.current.ArrowLeft === true) {
        currentRef.current!.longitude -= offset;
        console.log(1);
      }

      if (keysRef.current.s === true) {
        currentRef.current!.latitude -= offset;
      } else if (keysRef.current.ArrowDown === true) {
        currentRef.current!.latitude -= offset;
        console.log(1);
      }

      if (keysRef.current.d === true) {
        currentRef.current!.longitude += offset;
      } else if (keysRef.current.ArrowRight === true) {
        currentRef.current!.longitude += offset;
        console.log(1);
      }

      setCurrent({ ...currentRef.current! });
    }

    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("keyup", handleKeyup);

    let pollerId: ReturnType<typeof setInterval>;
    navigator.geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {
        currentRef.current = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        initialRef.current = { ...currentRef.current };
        setCurrent({ ...currentRef.current });
        pollerId = setInterval(poll, 500);
      },
      () => {},
      options,
    );

    return () => {
      clearInterval(pollerId);

      document.removeEventListener("keydown", handleKeydown);
      document.removeEventListener("keyup", handleKeyup);
    };
  }, []);

  return {
    initial: initialRef.current,
    current: currentRef.current,
    lost: false,
    metersTravelled: 0,
  };
}
