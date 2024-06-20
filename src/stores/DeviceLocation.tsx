import { useEffect, useRef, useState } from "react";

import { LOCATION } from "settings";
import { LocationInfo } from "types";
import { StoreFactory } from "stores";
import { getDistance } from "utils/map";
import { nullMapCoordinates, nullifyMapCoordinates } from "classes/MapCoordinates";

function createState(): LocationInfo {
  console.log("DeviceLocation createState");

  const [coordinates, setCoordinates] = useState(nullMapCoordinates());
  const [metersTravelled, setMetersTravelled] = useState(0);
  const [disabled, setDisabled] = useState(true);
  const [lost, setLost] = useState(false);
  const sessionTimerId = useRef<ReturnType<typeof setTimeout>>();
  const focusLostTime = useRef(0);
  const glitchCountRef = useRef(0);

  useEffect(
    () => {
      let coordinates = nullMapCoordinates();

      function markDisabled() {
        nullifyMapCoordinates(coordinates);
        setCoordinates(nullMapCoordinates());
        setDisabled(true);
      }

      function handleKeydown(ev: KeyboardEvent) {
        if (ev.key === "z") setDisabled((d) => !d);
      }

      function handleLostFocus() {
        if (
          document.visibilityState === "visible" &&
          Date.now() - focusLostTime.current < LOCATION.DEVICE.SESSION_DURATION
        ) {
          clearTimeout(sessionTimerId.current);
        } //
        else {
          focusLostTime.current = Date.now();
          sessionTimerId.current = setTimeout(
            markDisabled,
            LOCATION.DEVICE.SESSION_DURATION,
          );
        }
      }

      function handleUpdated(position: GeolocationPosition) {
        const coords = {
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
        };
        // console.log("location", coords.longitude, coords.latitude);
        if (isNaN(coordinates.longitude)) setDisabled(false);
        else {
          let travelDistance = 0;

          if (!lost) {
            travelDistance = getDistance(
              coordinates.longitude,
              coordinates.longitude,
              coordinates.latitude,
              coordinates.latitude,
            );
            // console.log(travelDistance);
            if (travelDistance > 50) {
              glitchCountRef.current += 1;
              console.log("location glitch");

              if (glitchCountRef.current < 4) return;
            } //
            else if (travelDistance < 3) {
              // console.log("distance too small");
              return;
            }
          }

          glitchCountRef.current = 0;
          coordinates.longitude = (coordinates.longitude + coords.longitude) / 2;
          coordinates.latitude = (coordinates.latitude + coords.latitude) / 2;

          setMetersTravelled((prevDistance) => prevDistance + travelDistance / 2);
        }
        coordinates = coords;
        setCoordinates(coordinates);
        setLost(false);
      }

      function handleError(error: GeolocationPositionError) {
        if (document.visibilityState !== "visible") return;

        console.log("Failed to get location", error.message);

        if (error.code === error.PERMISSION_DENIED) markDisabled();
        else if (error.code === error.TIMEOUT) setLost(true);
      }

      function pollPosition() {
        navigator.geolocation.getCurrentPosition(
          handleUpdated,
          handleError,
          LOCATION.DEVICE.GPS_OPTIONS,
        );
      }

      pollPosition();
      const pollerId = setInterval(pollPosition, LOCATION.DEVICE.GPS_OPTIONS.timeout);

      document.addEventListener("visibilitychange", handleLostFocus);
      document.addEventListener("keydown", handleKeydown);

      return () => {
        clearInterval(pollerId);

        document.removeEventListener("keydown", handleKeydown);
        document.removeEventListener("visibilitychange", handleLostFocus);
      };
    }, //
    [],
  );

  return {
    coordinates,
    metersTravelled,
    disabled,
    lost,
  };
}

export const { Provider: DeviceLocationProvider, useProvider: useDeviceLocation } =
  StoreFactory<LocationInfo>(createState);
