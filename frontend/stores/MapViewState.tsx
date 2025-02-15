import { useEffect, useState } from "react";

import StoreFactory from "./StoreFactory";
import type { MapViewState } from "frontend/types";
import { MAP_VIEWS } from "frontend/enums";
import {
  addKeyboardShortcut,
  removeKeyboardShortcut,
} from "frontend/utils/KeyboardShortcuts";

function createState(): MapViewState {
  const [mapView, setMapView] = useState(MAP_VIEWS.PLAYGROUND);

  // view change on keypress
  useEffect(
    () => {
      function handleKeyPress(ev: KeyboardEvent) {
        if (ev.key === "1") setMapView(MAP_VIEWS.PLAYGROUND);
        else if (ev.key === "2") setMapView(MAP_VIEWS.EVENT);
        else if (ev.key === "3") setMapView(MAP_VIEWS.WORLD);
      }

      addKeyboardShortcut(handleKeyPress);

      return () => {
        removeKeyboardShortcut(handleKeyPress);
      };
    }, //
    [],
  );

  return {
    mapView,
    setMapView,
  };
}

export const { Provider: MapViewStateProvider, useProvider: useMapViewState } =
  StoreFactory<MapViewState>(createState);
