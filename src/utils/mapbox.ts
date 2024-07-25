import mapboxgl from "mapbox-gl";

import { VIEW } from "settings";
import { mobileClient } from "./window";

declare module "mapbox-gl" {
  interface Map {
    isBusy: () => boolean;
    disableActions: () => void;
    enablePlaygroundActions: () => void;
    enableEventActions: () => void;
  }
}

mapboxgl.Map.prototype.isBusy = isBusy;
mapboxgl.Map.prototype.disableActions = disableActions;
mapboxgl.Map.prototype.enablePlaygroundActions = enablePlaygroundActions;
mapboxgl.Map.prototype.enableEventActions = enableEventActions;

function isBusy(this: mapboxgl.Map) {
  return this.isEasing() || this.isZooming() || this.isMoving() || this.isRotating();
}

function disableActions(this: mapboxgl.Map) {
  this.setMinPitch(0);
  this.setMaxPitch(85);
  this.setMinZoom(1);
  this.setMaxZoom(22);
  this.dragPan.disable();
  this.dragRotate.disable();
  this.scrollZoom.disable();
  this.touchPitch.disable();
  this.touchZoomRotate.disable();
  this.doubleClickZoom.disable();
}

function enablePlaygroundActions(this: mapboxgl.Map) {
  this.setMinPitch(20);
  this.setMaxPitch(80);
  this.setMinZoom(VIEW.PLAYGROUND.ZOOM - 2);
  this.setMaxZoom(VIEW.PLAYGROUND.ZOOM);
  this.dragPan.enable();
  this.dragRotate.enable();
  this.scrollZoom.enable();
  this.touchPitch.enable();
  this.touchZoomRotate.enable();
  if (mobileClient) this.doubleClickZoom.enable();
}

function enableEventActions(this: mapboxgl.Map) {
  this.setMinPitch(10);
  this.setMaxPitch(45);
  this.setMinZoom(VIEW.EVENT.ZOOM - 1);
  this.setMaxZoom(VIEW.EVENT.ZOOM);
  this.dragRotate.enable();
  this.scrollZoom.enable();
  this.touchPitch.enable();
  this.touchZoomRotate.enable();
  if (mobileClient) this.doubleClickZoom.enable();
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
