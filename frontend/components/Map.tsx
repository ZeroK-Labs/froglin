import type { MapRef } from "react-map-gl";
import { Map } from "react-map-gl";
import { useEffect, useRef, useState } from "react";

import type { WorldEvent } from "common/types";
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
  WorldEventMarker,
} from "frontend/components";

// attach map to the window object to persist across module reloads
const _window = window as any;
_window.__map_load_duration ??= VIEW.FIRST_FLIGHT_DURATION;

const LONGITUDE_DELTA = 6;

export default function MapScreen() {
  const viewLevelRef = useRef(MAP_VIEWS.WORLD);
  const lastViewChangeTimeRef = useRef(0);
  const moveTimerRef = useRef<Timer>();

  const [map, setMap] = useState<mapboxgl.Map>();
  const [worldEvents, setWorldEvents] = useState<WorldEvent[]>([]);

  const location = useLocation();
  const { mapView, setMapView } = useMapViewState();
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
    clearInterval(moveTimerRef.current);

    map.disableActions();

    if (mapView === MAP_VIEWS.PLAYGROUND) {
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
      // revert when event is yet to be initialized from the server
      const bounds = getEventBounds();
      if (
        bounds[0][0] === 0 &&
        bounds[0][1] === 0 &&
        bounds[1][0] === 0 &&
        bounds[1][1] === 0
      ) {
        setMapView(MAP_VIEWS.PLAYGROUND);
        return;
      }

      map.fitBounds(bounds, {
        zoom: VIEW.EVENT.ZOOM - 0.5,
        pitch: VIEW.EVENT.PITCH,
        bearing: VIEW.EVENT.BEARING,
        duration: VIEW.TRANSITION_DURATION,
      });
    } //
    else if (mapView === MAP_VIEWS.WORLD) {
      // longitude animation
      moveTimerRef.current = setTimeout(
        () => {
          if (viewLevelRef.current !== MAP_VIEWS.WORLD) return;

          function rotateGlobe() {
            if (!map || viewLevelRef.current !== MAP_VIEWS.WORLD) {
              clearInterval(moveTimerRef.current);

              return;
            }

            const center = map.getCenter();
            center.lng -= LONGITUDE_DELTA;
            map.flyTo({
              center,
              duration: VIEW.WORLD_VIEW_PANNING_STEP_DURATION,
              easing: (x: number) => x, // linear easing
            });
          }

          moveTimerRef.current = setInterval(
            rotateGlobe,
            VIEW.WORLD_VIEW_PANNING_STEP_DURATION,
          );
        }, //
        VIEW.TRANSITION_DURATION - VIEW.WORLD_VIEW_PANNING_STEP_DURATION,
      );

      map.flyTo({
        zoom: VIEW.WORLD.ZOOM,
        pitch: VIEW.WORLD.PITCH,
        duration: VIEW.TRANSITION_DURATION,
      });
    }

    // used to enable actions per specfied view
    setTimeout(
      () => {
        if (!map || viewLevelRef.current !== mapView) return;

        if (mapView === MAP_VIEWS.PLAYGROUND) map.enablePlaygroundActions();
        else if (mapView === MAP_VIEWS.EVENT) map.enableEventActions();
        else if (mapView === MAP_VIEWS.WORLD) map.enableWorldActions();
      }, //
      VIEW.TRANSITION_DURATION,
    );
  }

  useEffect(
    () => {
      async function fetchWorldEvents() {
        const response = await fetch(`${process.env.BACKEND_URL}/world-events`);
        const data = await response.json();
        setWorldEvents(data);
      }

      fetchWorldEvents();

      return () => {
        // stop fly-in on HMR updates
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

          setTimeout(
            () => {
              map.setMinZoom(minZoom);
              map.enableZoom();
            }, //
            VIEW.LOCATION_FOLLOW_DURATION,
          );

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

          {worldEvents.map((event) => (
            <WorldEventMarker
              visible={mapView === MAP_VIEWS.WORLD}
              key={event.name}
              event={event}
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

      {!map || location.disabled || mapView !== MAP_VIEWS.PLAYGROUND ? null : (
        <LocationRestoreButton map={map} />
      )}
    </>
  );
}
