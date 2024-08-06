import { FunctionComponent } from "react";

import { DeviceLocationProvider, useDeviceLocation } from "./DeviceLocation";
import { KeyboardLocationProvider, useKeyboardLocation } from "./KeyboardLocation";
import { LocationInfo } from "frontend/types";
import { mobileClient } from "frontend/utils/window";

let LocationProvider: FunctionComponent<any>;
let useLocation: () => LocationInfo;

if (mobileClient) {
  LocationProvider = DeviceLocationProvider;
  useLocation = useDeviceLocation;
} //
else {
  LocationProvider = KeyboardLocationProvider;
  useLocation = useKeyboardLocation;
}

export { LocationProvider, useLocation };
