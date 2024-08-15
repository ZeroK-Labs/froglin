import { Map, MapRef } from "react-map-gl";
import { useEffect, useRef, useState } from "react";

import { MAP_VIEWS } from "frontend/enums";
import { VIEW } from "frontend/settings";
import { setMapFog } from "frontend/utils/mapbox";
import {
  RevealingCircleStateProvider,
  useGameEvent,
  useLocation,
  useMapViewState,
} from "frontend/stores";
import {
  CanvasOverlay,
  FroglinMarker,
  GameEventView,
  InterestPointMarker,
  LocationRestoreButton,
  PlayerMarker,
} from "frontend/components";

// attach map to the window object to persist across module reloads
const _window = window as any;
_window.__map_load_duration ??= VIEW.FIRST_FLIGHT_DURATION;

export default function MapScreen() {
  const viewLevelRef = useRef(MAP_VIEWS.WORLD);
  const lastViewChangeTimeRef = useRef(0);

  const [map, setMap] = useState<mapboxgl.Map>();

  const location = useLocation();
  const { mapView } = useMapViewState();
  const { getEventBounds, interestPoints, revealedFroglins } = useGameEvent();

  function mapCallback(node: MapRef) {
    if (!node) return;

    if (!map) {
      const map = node.getMap();
      setMapFog(map);
      setMap(map);

      return;
    }

    if (viewLevelRef.current === mapView || location.disabled) return;

    viewLevelRef.current = mapView;
    lastViewChangeTimeRef.current = Date.now();

    map.disableActions();

    // ensure only one handler is subscribed
    map.off("idle", map.enablePlaygroundActions);
    map.off("idle", map.enableEventActions);

    if (mapView === MAP_VIEWS.PLAYGROUND) {
      map.once("idle", map.enablePlaygroundActions);
      map.flyTo({
        center: [location.coordinates.longitude, location.coordinates.latitude],
        zoom: VIEW.PLAYGROUND.ZOOM,
        pitch: VIEW.PLAYGROUND.PITCH,
        bearing: VIEW.PLAYGROUND.BEARING,
        duration: _window.__map_load_duration,
        // https://easings.net/#easeInOutSine
        // easing: (x: number): number => {
        //   return -(Math.cos(Math.PI * x) - 1) / 2;
        // },
      });
      _window.__map_load_duration = VIEW.TRANSITION_DURATION;
    } //
    else if (mapView === MAP_VIEWS.EVENT) {
      map.once("idle", map.enableEventActions);
      map.fitBounds(getEventBounds(), {
        zoom: VIEW.EVENT.ZOOM - 0.5,
        pitch: VIEW.EVENT.PITCH,
        bearing: VIEW.EVENT.BEARING,
        duration: VIEW.TRANSITION_DURATION,
      });
    }
  }

  // stop fly-in on HMR updates
  useEffect(
    () => {
      return () => {
        _window.__map_load_duration = 0;
      };
    }, //
    [],
  );

  // map camera follows player
  useEffect(
    () => {
      // console.log("map - location change", location);

      if (!map || mapView !== MAP_VIEWS.PLAYGROUND || location.disabled) return;

      const center: [number, number] = [
        location.coordinates.longitude,
        location.coordinates.latitude,
      ];

      // skip follow when not in view
      const { x, y } = map.project(center);
      const { clientWidth, clientHeight } = map.getContainer();
      if (x < 0 || x > clientWidth || y < 0 || y > clientHeight) return;

      // wait for view switch animation to complete
      if (VIEW.TRANSITION_DURATION - (Date.now() - lastViewChangeTimeRef.current) > 0) {
        return;
      }

      const timerId = setTimeout(
        () => {
          if (map.isBusy()) return;

          // flying animation tries to zoom-out past minimum zoom
          const minZoom = map.getMinZoom();
          map.disableZoom();
          map.setMinZoom(1);

          setTimeout(() => {
            map.setMinZoom(minZoom);
            map.enableZoom();
          }, VIEW.LOCATION_FOLLOW_DURATION);

          map.flyTo({
            center,
            duration: VIEW.LOCATION_FOLLOW_DURATION,
          });
        }, //
        VIEW.LOCATION_FOLLOW_DELAY,
      );

      return () => {
        if (mapView !== MAP_VIEWS.PLAYGROUND || location.disabled) {
          clearTimeout(timerId);
        }
      };
    }, //
    [mapView, location.coordinates.longitude, location.coordinates.latitude],
  );

  return (
    <>
      <div className="fixed inset-0 h-dvh w-dvw">
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
          {interestPoints.map((point) => (
            <InterestPointMarker
              key={point.id}
              point={point}
            />
          ))}

          {revealedFroglins.map((froglin) => (
            <FroglinMarker
              key={froglin.id}
              froglin={froglin}
            />
          ))}

          <GameEventView />

          {!map || location.disabled ? null : (
            <>
              <RevealingCircleStateProvider>
                <CanvasOverlay />
                <PlayerMarker />
              </RevealingCircleStateProvider>
            </>
          )}
        </Map>
      </div>

      {!map || location.disabled ? null : <LocationRestoreButton map={map} />}
    </>
  );
}
