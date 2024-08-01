import { useEffect, useState } from "react";

import { LOCATION } from "settings";
import { LocationInfo } from "types";
import { StoreFactory } from "stores";
import { getDistance } from "../../common/utils/map";
import { nullMapCoordinates, nullifyMapCoordinates } from "classes/MapCoordinates";

function createState(): LocationInfo {
  // console.log("DeviceLocation createState");

  const [coordinates, setCoordinates] = useState(nullMapCoordinates());
  const [metersTravelled, setMetersTravelled] = useState(0);
  const [disabled, setDisabled] = useState(true);
  const [lost, setLost] = useState(false);

  useEffect(
    () => {
      const divGPS = document.getElementById("gps")!;
      const coordinateAcc = { longitude: 0, latitude: 0 };
      const samplesTotal = 1;

      let coordinates = nullMapCoordinates();
      let sampleCount = 0;
      let lostCount = 0;

      function markDisabled() {
        sampleCount = 0;
        nullifyMapCoordinates(coordinates);
        setCoordinates(nullMapCoordinates());
        setDisabled(true);
      }

      function handleUpdated(position: GeolocationPosition) {
        divGPS.innerText = "";
        // setTimeout(
        //   () => {
        //     divGPS.innerText = `${position.coords.longitude} ${position.coords.latitude} ${position.coords.accuracy.toFixed(2)}`;
        //   }, //
        //   250,
        // );

        coordinateAcc.longitude += position.coords.longitude;
        coordinateAcc.latitude += position.coords.latitude;
        sampleCount += 1;

        if (sampleCount !== samplesTotal) return;

        const newCoordinates = {
          longitude: coordinateAcc.longitude / sampleCount,
          latitude: coordinateAcc.latitude / sampleCount,
        };
        coordinateAcc.longitude = coordinateAcc.latitude = 0;
        sampleCount = 0;

        if (!isNaN(coordinates.longitude)) {
          const travelDistance = getDistance(
            coordinates.longitude,
            newCoordinates.longitude,
            coordinates.latitude,
            newCoordinates.latitude,
          );

          setMetersTravelled((d) => d + travelDistance);
        }

        coordinates = newCoordinates;

        lostCount = 0;
        setLost(false);
        setDisabled(false);
        setCoordinates(coordinates);
      }

      function handleError(error: GeolocationPositionError) {
        if (document.visibilityState !== "visible") return;

        console.log("Failed to get location " + error.message);

        divGPS.innerText = "";
        setTimeout(
          () => {
            divGPS.innerText = error.message;
          }, //
          250,
        );

        if (error.code === error.PERMISSION_DENIED) markDisabled();
        else if (error.code === error.TIMEOUT) {
          lostCount += 1;
          if (lostCount === 3) setLost(true);
          else if (lostCount === 5) markDisabled();
        }
      }

      function pollPosition() {
        navigator.geolocation.getCurrentPosition(
          handleUpdated,
          handleError,
          LOCATION.DEVICE.GPS_OPTIONS,
        );
      }

      let sessionTimerId: Timer;
      let focusLostTime = 0;
      function handleLostFocus() {
        if (document.visibilityState === "visible") {
          if (Date.now() - focusLostTime < LOCATION.DEVICE.SESSION_DURATION) {
            clearTimeout(sessionTimerId);
          }
        }
        //
        else {
          focusLostTime = Date.now();
          sessionTimerId = setTimeout(markDisabled, LOCATION.DEVICE.SESSION_DURATION);
        }
      }

      function handleKeydown(ev: KeyboardEvent) {
        if (ev.key === "z") setDisabled((d) => !d);
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
