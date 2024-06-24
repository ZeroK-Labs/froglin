import mapboxgl from "mapbox-gl";

import { VIEW } from "settings";
import { mobileClient } from "./window";

declare module "mapbox-gl" {
  interface Map {
    isBusy: () => boolean;
  }
}

function isBusy(this: mapboxgl.Map) {
  return this.isEasing() || this.isZooming() || this.isMoving() || this.isRotating();
}

mapboxgl.Map.prototype.isBusy = isBusy;

export function disableMapActions(map: mapboxgl.Map) {
  map.setMinPitch(0);
  map.setMaxPitch(85);
  map.setMinZoom(1);
  map.setMaxZoom(22);
  map.dragPan.disable();
  map.dragRotate.disable();
  map.scrollZoom.disable();
  map.touchPitch.disable();
  map.touchZoomRotate.disable();
  map.doubleClickZoom.disable();
}

export function enableMapActionsPlayground(map: mapboxgl.Map) {
  map.setMinPitch(20);
  map.setMaxPitch(80);
  map.setMinZoom(VIEW.PLAYGROUND.ZOOM - 2);
  map.setMaxZoom(VIEW.PLAYGROUND.ZOOM);
  map.dragPan.enable();
  map.dragRotate.enable();
  map.scrollZoom.enable();
  map.touchPitch.enable();
  map.touchZoomRotate.enable();
  if (mobileClient) map.doubleClickZoom.enable();
}

export function enableMapActionsEvent(map: mapboxgl.Map) {
  map.setMinPitch(10);
  map.setMaxPitch(45);
  map.setMinZoom(VIEW.EVENT.ZOOM - 1);
  map.setMaxZoom(VIEW.EVENT.ZOOM);
  map.dragRotate.enable();
  map.scrollZoom.enable();
  map.touchPitch.enable();
  map.touchZoomRotate.enable();
  if (mobileClient) map.doubleClickZoom.enable();
}

// work-around to counteract the sky being black after loading
export function setMapFog(map: mapboxgl.Map) {
  map.once("styledata", () => {
    map.setFog({
      // range: [1, 20],
      color: "rgba(16, 6, 16, 0.9)", // Lower atmosphere
      "high-color": "rgb(0, 12, 14)", // Upper atmosphere
      "horizon-blend": 0.08, // Atmosphere thickness (default 0.2 at low zooms)
      "space-color": "rgb(19, 12, 21)", // Background color
      "star-intensity": 0.45, // Background star brightness (default 0.35 at low zoooms )
    });
  });
}
