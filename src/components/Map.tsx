import { Map, MapRef } from "react-map-gl";
import { useEffect, useRef } from "react";

import { MAP_VIEWS } from "enums";
import { RevealingCircleStateProvider, useDemoEventState, useLocation } from "stores";
import { VIEW } from "settings";
import {
  CanvasOverlay,
  FroglinMarker,
  GameEventView,
  InterestPointMarker,
  LocationRestoreButton,
  PlayerMarker,
} from "components";
import {
  disableMapActions,
  enableMapActionsEvent,
  enableMapActionsPlayground,
  setMapFog,
} from "utils/mapbox";

export default function MapScreen({ view }: { view: MAP_VIEWS }) {
  const mapRef = useRef<mapboxgl.Map>();
  const enableMapActionsRef = useRef<() => void>(() => {});
  const viewLevelRef = useRef(MAP_VIEWS.WORLD);
  const durationRef = useRef(VIEW.FIRST_FLIGHT_ANIMATION_DURATION);

  const location = useLocation();
  const { getEventBounds, interestPoints, revealedFroglins } = useDemoEventState();

  function mapCallback(node: MapRef) {
    if (!node) return;

    if (!mapRef.current) {
      mapRef.current = node.getMap();
      setMapFog(mapRef.current);
    }

    if (viewLevelRef.current === view || location.disabled) return;

    viewLevelRef.current = view;
    disableMapActions(mapRef.current);

    let enableMapActions: (map: mapboxgl.Map) => void;
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

    // ensure only one handler is subscribed
    mapRef.current.off("moveend", enableMapActionsRef.current);
    enableMapActionsRef.current = () => {
      enableMapActions(mapRef.current!);
    };
    mapRef.current.once("moveend", enableMapActionsRef.current);
  }

  // map camera follows player
  useEffect(
    () => {
      // console.log("map - location change", location);

      if (location.disabled || !mapRef.current || mapRef.current!.isBusy()) return;

      setTimeout(
        () => {
          mapRef.current!.flyTo({
            center: [location.coordinates.longitude, location.coordinates.latitude],
            duration: VIEW.LOCATION_FOLLOW_ANIMATION_DURATION,
          });
        }, //
        VIEW.LOCATION_FOLLOW_ANIMATION_DELAY,
      );
    }, //
    [location.coordinates.longitude, location.coordinates.latitude],
  );

  return (
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

        <GameEventView visible={view === MAP_VIEWS.EVENT} />

        {!mapRef.current || location.disabled ? null : (
          <>
            <RevealingCircleStateProvider>
              <CanvasOverlay />
              <PlayerMarker view={view} />
            </RevealingCircleStateProvider>

            <LocationRestoreButton map={mapRef.current} />
          </>
        )}
      </Map>
    </div>
  );
}
