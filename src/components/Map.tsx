import { LngLatBoundsLike, Map, MapRef, useMap } from "react-map-gl";
import { useEffect, useRef, useState } from "react";

import { BurgerMenu } from "components";
import { FroglinMarker, GameEventView, PlayerMarker } from "components";
import { GameEvent } from "types";
import { MAP_VIEWS } from "enums";
import { useLocation } from "hooks";
import {
  createGameEvent,
  generateCloseFroglinsCoordinates,
  generateEventBounds,
  generateSpreadOutFroglinsCoordinates,
} from "mocks";

export default function MapScreen() {
  const gameEventRef = useRef<GameEvent>(createGameEvent());
  const tickerRef = useRef<ReturnType<typeof setInterval>>();
  const durationRef = useRef(7_000);
  const zoomLevelRef = useRef(MAP_VIEWS.WORLD);
  const [view, setView] = useState(MAP_VIEWS.PLAYGROUND);

  const location = useLocation();
  let map = useMap().current?.getMap();

  function mapCallback(node: MapRef) {
    if (!node) return;

    if (!location.current) {
      zoomLevelRef.current = MAP_VIEWS.WORLD;
      return;
    }

    if (gameEventRef.current.bounds.length === 0) return;

    if (zoomLevelRef.current === view) return;

    zoomLevelRef.current = view;
    map = node.getMap();

    map.dragPan.disable();
    map.dragRotate.disable();

    if (view === MAP_VIEWS.PLAYGROUND) {
      node.flyTo({
        center: [location.current.longitude, location.current.latitude],
        zoom: 18,
        pitch: 60,
        bearing: -30,
        duration: durationRef.current,
      });

      map.setMinPitch(20);
      map.setMaxPitch(70);

      setTimeout(() => {
        map!.dragPan.enable();
        map!.dragRotate.enable();
      }, durationRef.current);

      durationRef.current = 3_000;
    } //
    else if (view === MAP_VIEWS.EVENT) {
      node.fitBounds(gameEventRef.current.getLngLatBoundsLike(), {
        animate: true,
        pitch: 30,
        bearing: 30,
        zoom: 15,
        duration: durationRef.current,
      });

      map.setMinPitch(10);
      map.setMaxPitch(40);

      setTimeout(() => {
        map!.dragRotate.enable();
      }, durationRef.current);
    }
  }

  useEffect(() => {
    function createFroglins() {
      gameEventRef.current.froglinCoordinates = {
        spreadOut: generateSpreadOutFroglinsCoordinates(
          gameEventRef.current.location,
        ),
        close: generateCloseFroglinsCoordinates(gameEventRef.current.location),
      };
    }

    gameEventRef.current.bounds = generateEventBounds(
      gameEventRef.current.location,
    );
    createFroglins();

    clearInterval(tickerRef.current);
    gameEventRef.current.startTime = Date.now();
    tickerRef.current = setInterval(() => {
      const diff = Date.now() - gameEventRef.current.startTime;

      // console.log(Math.floor(diff/1000));

      if (diff >= gameEventRef.current.timePerEpoch) {
        gameEventRef.current.startTime = Date.now();
        gameEventRef.current.epochs -= 1;

        createFroglins();
      }
    }, 1_000);

    return () => {
      clearInterval(tickerRef.current);
    };
  }, [gameEventRef.current.location]);

  useEffect(() => {
    if (location.initial) gameEventRef.current.location = location.initial;
    else gameEventRef.current.location = { latitude: 0, longitude: 0 };
  }, [location.initial]);

  return (
    <div className="fixed left-0 top-0 h-full w-full">
      <Map
        ref={mapCallback}
        mapboxAccessToken={process.env.MAPBOX_ACCESS_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        // disable right-bottom information
        attributionControl={false}
        // @ts-ignore make all animations essential
        respectPrefersReducedMotion={false}
        projection={{ name: "globe" }}
        // fit the globe vertically in view
        initialViewState={{ zoom: 2.62 }}
        doubleClickZoom={false}
        scrollZoom={false}
        dragRotate={false}
        dragPan={false}
      >
        {location.current ? (
          <>
            {gameEventRef.current.froglinCoordinates.spreadOut.map(
              (location, index) => (
                <FroglinMarker
                  key={index}
                  location={location}
                />
              ),
            )}
            {gameEventRef.current.froglinCoordinates.close.map(
              (location, index) => (
                <FroglinMarker
                  key={index}
                  location={location}
                />
              ),
            )}

            <GameEventView
              visible={view === MAP_VIEWS.EVENT}
              game={gameEventRef.current}
            />

            <PlayerMarker location={location.current} />
          </>
        ) : null}
      </Map>

      <BurgerMenu
        view={view}
        setView={setView}
      />
    </div>
  );
}
