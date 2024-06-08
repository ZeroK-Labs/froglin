import { useEffect, useRef, useState } from "react";
import { getDistance } from "utils/get-distance";
import { MapCoordinates } from "types";

const options = {
  enableHighAccuracy: false,
  maximumAge: 0,
  timeout: 3_000,
};

const MIN_DISTANCE_THRESHOLD_IN_METERS = 0.5;

export default function useLocation() {
  const [initial, setInitial] = useState<MapCoordinates | null>(null);
  const [current, setCurrent] = useState<MapCoordinates | null>(null);
  const [lost, setLost] = useState(false);
  const [distance, setDistance] = useState(0); // in meters
  const currentRef = useRef<MapCoordinates | null>(null);
  const lastPosition = useRef<MapCoordinates | null>(null);
  function setCurrentLocation(coords: MapCoordinates | null) {
    setCurrent(coords);
    currentRef.current = coords;
    if (lastPosition.current && coords) {
      const traveled = getDistance(
        lastPosition.current.latitude,
        coords.latitude,
        lastPosition.current.longitude,
        coords.longitude,
      );
      if (traveled > MIN_DISTANCE_THRESHOLD_IN_METERS) {
        setDistance((prevDistance) => prevDistance + traveled);
      }
    }
    lastPosition.current = coords;
  }

  function handleUpdated(position: GeolocationPosition) {
    const coords = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    if (currentRef.current === null) {
      setInitial(coords);
      lastPosition.current = coords;
    } else {
      coords.longitude = (coords.longitude + currentRef.current.longitude) / 2;
      coords.latitude = (coords.latitude + currentRef.current.latitude) / 2;
    }

    setCurrentLocation(coords);
  }

  function handleError(error: GeolocationPositionError) {
    if (document.visibilityState !== "visible") return;

    console.log(error.message);

    if (error.code === error.PERMISSION_DENIED) {
      setInitial(null);
      setCurrentLocation(null);
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
    current,
    lost,
    distance,
  };
}
