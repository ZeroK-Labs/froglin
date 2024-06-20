import mapboxgl from "mapbox-gl";
import { Map, MapRef } from "react-map-gl";
import { useEffect, useRef } from "react";

import { VIEW } from "settings";
import { MAP_VIEWS } from "enums";
import { mobileClient } from "utils/window";
import {
  CanvasOverlay,
  FroglinMarker,
  GameEventView,
  InterestPointMarker,
  LocationRestoreButton,
  PlayerMarker,
} from "components";
import {
  CircleIndicatorStateProvider,
  useGameEventState,
  useLocation,
  useViewState,
} from "stores";

function disableMapActions(map: mapboxgl.Map) {
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

function enableMapActionsPlayground(map: mapboxgl.Map, view: MAP_VIEWS) {
  if (view !== MAP_VIEWS.PLAYGROUND) return;

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

function enableMapActionsEvent(map: mapboxgl.Map, view: MAP_VIEWS) {
  if (view !== MAP_VIEWS.EVENT) return;

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

export default function MapScreen() {
  const idleCallbackRef = useRef<() => void>(() => {});
  const viewLevelRef = useRef(MAP_VIEWS.WORLD);
  const durationRef = useRef(VIEW.FLY_ANIMATION_DURATION);

  const mapRef = useRef<mapboxgl.Map>();

  const location = useLocation();
  const { view } = useViewState();
  const { getEventBounds, interestPoints, revealedFroglins } = useGameEventState();

  function mapCallback(node: MapRef) {
    if (!node || location.disabled) return;
    if (viewLevelRef.current === view) return;

    if (!mapRef.current) {
      mapRef.current = node.getMap();

      // work-around to counteract the sky being black after loading
      mapRef.current.once("styledata", () => {
        mapRef.current!.setFog({
          // range: [1, 20],
          color: "rgba(16, 6, 16, 0.9)", // Lower atmosphere
          "high-color": "rgb(0, 12, 14)", // Upper atmosphere
          "horizon-blend": 0.08, // Atmosphere thickness (default 0.2 at low zooms)
          "space-color": "rgb(19, 12, 21)", // Background color
          "star-intensity": 0.45, // Background star brightness (default 0.35 at low zoooms )
        });

        mapRef.current!.once("idle", () => {
          mapCallback(node);
        });
      });

      return;
    }

    viewLevelRef.current = view;
    disableMapActions(mapRef.current);

    let enableMapActions: (map: mapboxgl.Map, view: MAP_VIEWS) => void;
    if (view === MAP_VIEWS.PLAYGROUND) {
      mapRef.current.flyTo({
        center: [location.coordinates.longitude, location.coordinates.latitude],
        zoom: VIEW.PLAYGROUND.ZOOM,
        pitch: VIEW.PLAYGROUND.PITCH,
        bearing: VIEW.PLAYGROUND.BEARING,
        duration: durationRef.current,
        // https://easings.net/#easeInOutSine
        // easing: (x: number): number => {
        //   return -(Math.cos(Math.PI * x) - 1) / 2;
        // },
      });
      enableMapActions = enableMapActionsPlayground;
      durationRef.current = VIEW.VIEW_ANIMATION_DURATION;
    } //
    else if (view === MAP_VIEWS.EVENT) {
      mapRef.current.fitBounds(getEventBounds(), {
        zoom: VIEW.EVENT.ZOOM - 0.5,
        pitch: VIEW.EVENT.PITCH,
        bearing: VIEW.EVENT.BEARING,
        duration: VIEW.VIEW_ANIMATION_DURATION,
      });
      enableMapActions = enableMapActionsEvent;
    }

    // ensure only one idle handle is subscribed
    mapRef.current.off("moveend", idleCallbackRef.current);
    idleCallbackRef.current = () => {
      enableMapActions(mapRef.current!, viewLevelRef.current);
    };
    mapRef.current.once("moveend", idleCallbackRef.current);
  }

  // map camera follows player
  useEffect(
    () => {
      console.log("map - location change", location);

      if (!mapRef.current || location.disabled) return;

      mapRef.current.flyTo({
        center: [location.coordinates.longitude, location.coordinates.latitude],
        duration: 1_000,
      });
    }, //
    [location.coordinates.longitude, location.coordinates.latitude],
  );

  return (
    <div className="fixed inset-0 h-full w-full">
      <Map
        reuseMaps
        ref={mapCallback}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        // disable right-bottom information
        attributionControl={false}
        // @ts-expect-error - make all animations essential
        respectPrefersReducedMotion={false}
        projection={{ name: "globe" }}
        // initialViewState={
        //   {
        //     // zoom: 2.77, // fit the globe vertically in view (without any padding/margin)
        //     // zoom: 1,
        //     // pitch: 0,
        //     // bearing: 50,
        //   }
        // }
      >
        <>
          {interestPoints.map((point) => (
            <InterestPointMarker
              key={point.id}
              point={point}
            />
          ))}
          {revealedFroglins.map((froglin) =>
            isNaN(froglin.coordinates.longitude) ? null : (
              <FroglinMarker
                key={froglin.id}
                froglin={froglin}
              />
            ),
          )}

          <GameEventView visible={view === MAP_VIEWS.EVENT} />

          {!mapRef.current || location.disabled ? null : (
            <>
              <CircleIndicatorStateProvider>
                <CanvasOverlay />
                <PlayerMarker />
              </CircleIndicatorStateProvider>

              <LocationRestoreButton map={mapRef.current} />
            </>
          )}
        </>
      </Map>
    </div>
  );
}
