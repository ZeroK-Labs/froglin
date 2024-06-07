import { useEffect, useState } from "react";

import MapCoordinates from "types/MapCoordinates";

const options = {
  enableHighAccuracy: false,
  maximumAge: 0,
  timeout: 3_000,
};

export default function useLocation() {
  const [initial, setInitial] = useState<MapCoordinates | null>(null);
  const [current, setCurrent] = useState<MapCoordinates | null>(null);
  const [lost, setLost] = useState(false);

  function handleUpdated(position: GeolocationPosition) {
    const coords = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    if (current === null) setInitial(coords);
    else {
      coords.longitude = (coords.longitude + current.longitude) / 2;
      coords.latitude = (coords.latitude + current.latitude) / 2;
    }

    setCurrent(coords);
  }

  function handleError(error: GeolocationPositionError) {
    if (document.visibilityState !== "visible") return;

    console.log(error.message);

    if (error.code === error.PERMISSION_DENIED) {
      setInitial(null);
      setCurrent(null);
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

  return { initial, current, lost };
}
