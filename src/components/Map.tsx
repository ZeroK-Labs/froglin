import { Map, MapRef } from "react-map-gl";
import { useEffect, useRef, useState } from "react";

import { MAP_VIEWS } from "src/enums";
import { VIEW } from "src/settings";
import { setMapFog } from "src/utils/mapbox";
import {
  RevealingCircleStateProvider,
  useGameEvent,
  useLocation,
  useMapViewState,
} from "src/stores";
import {
  CanvasOverlay,
  FroglinMarker,
  GameEventView,
  InterestPointMarker,
  LocationRestoreButton,
  PlayerMarker,
} from "src/components";

export default function MapScreen() {
  const viewLevelRef = useRef(MAP_VIEWS.WORLD);
  const durationRef = useRef(VIEW.FIRST_FLIGHT_ANIMATION_DURATION);
  const lastViewChangeTimeRef = useRef(0);
  const firstLoadRef = useRef(true);

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
      map.once("idle", () => {
        firstLoadRef.current = false;
      });
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
        duration: durationRef.current,
        // https://easings.net/#easeInOutSine
        // easing: (x: number): number => {
        //   return -(Math.cos(Math.PI * x) - 1) / 2;
        // },
      });
      durationRef.current = VIEW.VIEW_ANIMATION_DURATION;
    } //
    else if (mapView === MAP_VIEWS.EVENT) {
      map.once("idle", map.enableEventActions);
      map.fitBounds(getEventBounds(), {
        zoom: VIEW.EVENT.ZOOM - 0.5,
        pitch: VIEW.EVENT.PITCH,
        bearing: VIEW.EVENT.BEARING,
        duration: VIEW.VIEW_ANIMATION_DURATION,
      });
    }
  }

  // map camera follows player
  useEffect(
    () => {
      // console.log("map - location change", location);

      if (!map || firstLoadRef.current) return;

      if (mapView !== MAP_VIEWS.PLAYGROUND || location.disabled) return;

      const center: [number, number] = [
        location.coordinates.longitude,
        location.coordinates.latitude,
      ];

      // skip follow when not in view
      const { x, y } = map.project(center);
      const { clientWidth, clientHeight } = map.getContainer();
      if (x < 0 || x > clientWidth || y < 0 || y > clientHeight) return;

      // wait for view switch animation to complete
      let diff =
        VIEW.VIEW_ANIMATION_DURATION - (Date.now() - lastViewChangeTimeRef.current);
      if (diff > 0) return;

      const timerId = setTimeout(
        () => {
          map.disableActions();
          map.off("idle", map.enablePlaygroundActions);
          map.flyTo({
            center,
            duration: VIEW.LOCATION_FOLLOW_ANIMATION_DURATION,
          });
          map.once("idle", map.enablePlaygroundActions);
        }, //
        VIEW.LOCATION_FOLLOW_ANIMATION_DELAY,
      );

      return () => {
        if (mapView !== MAP_VIEWS.PLAYGROUND || location.disabled)
          clearTimeout(timerId);
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

          {revealedFroglins.map((froglin) =>
            isNaN(froglin.coordinates.longitude) ? null : (
              <FroglinMarker
                key={froglin.id}
                froglin={froglin}
              />
            ),
          )}

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
