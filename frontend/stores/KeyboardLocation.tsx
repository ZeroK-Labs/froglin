import { useEffect, useState } from "react";

import type { KeyboardSymbol, LocationInfo } from "frontend/types";
import type { MapCoordinates } from "common/types";
import { AngleToRadian } from "common/utils/math";
import { LOCATION } from "frontend/settings";
import { RADIANS_PER_METER_LATITUDE } from "common/utils/map";
import { StoreFactory } from "frontend/stores";
import { nullKeyboard, nullifyKeyboard } from "frontend/classes/Keyboard";
import { nullMapCoordinates } from "frontend/classes/MapCoordinates";
import { shortcutsDisabled } from "frontend/utils/KeyboardShortcuts";

const KEYBOARD = nullKeyboard();

const OFFSET_LATITUDE = LOCATION.KEYBOARD.OFFSET * RADIANS_PER_METER_LATITUDE;

function handleKeydown(ev: KeyboardEvent) {
  KEYBOARD[ev.key as KeyboardSymbol] = true;
}

function handleKeyup(ev: KeyboardEvent) {
  KEYBOARD[ev.key as KeyboardSymbol] = false;
}

function handleLostFocus() {
  nullifyKeyboard(KEYBOARD);
}

function createState(): LocationInfo {
  // console.log("KeyboardLocation createState");

  const [coordinates, setCoordinates] = useState(nullMapCoordinates());
  const [disabled, setDisabled] = useState(true);

  useEffect(
    () => {
      let location: MapCoordinates;
      let pollerId: Timer;

      function pollKeys() {
        if (shortcutsDisabled()) {
          nullifyKeyboard(KEYBOARD);
          return;
        }

        if (KEYBOARD.z) setDisabled((d) => !d);

        const changed_latitude = KEYBOARD.w || KEYBOARD.s;
        const changed_longitude = KEYBOARD.a || KEYBOARD.d;
        if (!(changed_longitude || changed_latitude)) return;

        if (changed_longitude) {
          const offset_longitude =
            OFFSET_LATITUDE / Math.cos(location.latitude * AngleToRadian);

          if (KEYBOARD.a) location.longitude -= offset_longitude;
          if (KEYBOARD.d) location.longitude += offset_longitude;
        }
        if (KEYBOARD.w) location.latitude += OFFSET_LATITUDE;
        if (KEYBOARD.s) location.latitude -= OFFSET_LATITUDE;

        setCoordinates({ ...location });
      }

      navigator.geolocation.getCurrentPosition(
        (position: GeolocationPosition) => {
          setDisabled(false);

          location = {
            longitude: position.coords.longitude,
            latitude: position.coords.latitude,
          };
          setCoordinates(location);

          pollerId = setInterval(pollKeys, LOCATION.KEYBOARD.POLL_TIMEOUT);
        },
        (error: GeolocationPositionError) => {
          console.log("Failed to get location", error.message);
        },
        LOCATION.KEYBOARD.GPS_OPTIONS,
      );

      document.addEventListener("keydown", handleKeydown);
      document.addEventListener("keyup", handleKeyup);
      document.addEventListener("focusout", handleLostFocus);

      return () => {
        clearInterval(pollerId);

        document.removeEventListener("keydown", handleKeydown);
        document.removeEventListener("keyup", handleKeyup);
        document.removeEventListener("focusout", handleLostFocus);
      };
    }, //
    [],
  );

  return {
    coordinates,
    disabled,
    metersTravelled: 0,
    lost: false,
  };
}

export const { Provider: KeyboardLocationProvider, useProvider: useKeyboardLocation } =
  StoreFactory<LocationInfo>(createState);
