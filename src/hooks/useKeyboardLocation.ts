import { useEffect, useRef, useState } from "react";

import { MapCoordinates } from "types";

type Keys = {
  w: boolean;
  s: boolean;
  a: boolean;
  d: boolean;
};

const options = {
  enableHighAccuracy: false,
  maximumAge: 0,
  timeout: 10_000,
};

const offset = 0.00001; // ~ 1m

export default function useKeyboardLocation() {
  const [current, setCurrent] = useState<MapCoordinates | null>(null);
  const initalRef = useRef<MapCoordinates | null>(null);
  const currentRef = useRef<MapCoordinates | null>(null);
  const keysRef = useRef<Keys>({ w: false, s: false, a: false, d: false });

  useEffect(() => {
    function handleKeydown(ev: KeyboardEvent) {
      // @ts-ignore
      keysRef.current[ev.key] = true;
    }

    function handleKeyup(ev: KeyboardEvent) {
      // @ts-ignore
      keysRef.current[ev.key] = false;
    }

    function poll() {
      if (keysRef.current.w === true) currentRef.current!.latitude += offset;
      if (keysRef.current.a === true) currentRef.current!.longitude -= offset;
      if (keysRef.current.s === true) currentRef.current!.latitude -= offset;
      if (keysRef.current.d === true) currentRef.current!.longitude += offset;

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
        initalRef.current = { ...currentRef.current };
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
    initial: initalRef.current,
    current: currentRef.current,
    lost: false,
    metersTravelled: 0,
  };
}
