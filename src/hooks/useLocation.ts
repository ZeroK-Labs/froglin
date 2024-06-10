import { useEffect, useRef, useState } from "react";

import { MapCoordinates } from "types";
import { getDistance } from "utils/map";

const options = {
  enableHighAccuracy: false,
  maximumAge: 0,
  timeout: 5_000,
};

export default function useLocation() {
  const [initial, setInitial] = useState<MapCoordinates | null>(null);
  const [lost, setLost] = useState(false);
  const [metersTravelled, setMetersTravelled] = useState(0);
  const currentRef = useRef<MapCoordinates | null>(null);
  const glitchCountRef = useRef(0);

  function handleUpdated(position: GeolocationPosition) {
    const coords = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    if (currentRef.current === null) setInitial(coords);
    else {
      const traveled = getDistance(
        currentRef.current.latitude,
        coords.latitude,
        currentRef.current.longitude,
        coords.longitude,
      );

      if (traveled > 15) {
        glitchCountRef.current += 1;

        if (glitchCountRef.current < 6) return;
      } //
      else if (traveled < 3) return;

      glitchCountRef.current = 0;
      coords.longitude = (coords.longitude + currentRef.current.longitude) / 2;
      coords.latitude = (coords.latitude + currentRef.current.latitude) / 2;

      setMetersTravelled((prevDistance) => prevDistance + traveled / 2);
    }

    setLost(false);
    currentRef.current = coords;
  }

  function handleError(error: GeolocationPositionError) {
    if (document.visibilityState !== "visible") return;

    console.log(error.message);

    if (error.code === error.PERMISSION_DENIED) {
      setInitial(null);
      currentRef.current = null;
    } else if (error.code === error.TIMEOUT) setLost(true);
  }

  function poll() {
    navigator.geolocation.getCurrentPosition(
      handleUpdated,
      handleError,
      options,
    );
  }

  useEffect(() => {
    poll();
    const pollerId = setInterval(poll, options.timeout);

    return () => {
      clearInterval(pollerId);
    };
  }, []);

  return {
    initial,
    current: currentRef.current,
    lost,
    metersTravelled,
  };
}
