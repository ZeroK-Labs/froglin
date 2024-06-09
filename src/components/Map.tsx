import mapboxgl from "mapbox-gl";
import { Map, MapRef } from "react-map-gl";
import { useEffect, useRef, useState } from "react";

import { GameEvent, MapCoordinates, Froglin } from "types";
import { MAP_VIEWS } from "enums";
import { useKeyboardLocation as useLocation } from "hooks";
import { createGameEvent } from "mocks";
import {
  BurgerMenu,
  CanvasOverlay,
  FroglinMarker,
  GameEventView,
  InfoBar,
  MyLocationButton,
  PlayerMarker,
} from "components";

export default function MapScreen() {
  const gameEventRef = useRef<GameEvent>(createGameEvent());
  const epochTickerRef = useRef<ReturnType<typeof setInterval>>();
  const durationRef = useRef(7_000);
  const viewLevelRef = useRef(MAP_VIEWS.WORLD);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [view, setView] = useState(MAP_VIEWS.PLAYGROUND);
  const [countdownTime, setCountdownTime] = useState(0);
  const [capturedFroglins, setCapturedFroglins] = useState<Froglin[]>([]);

  const location = useLocation();

  function updateRevealed(
    revealedFroglins: Froglin[],
    remainingFroglins: MapCoordinates[],
  ) {
    gameEventRef.current.revealedFroglins.push(...revealedFroglins);
    gameEventRef.current.dormantFroglins = remainingFroglins;
  }

  function updateCaught(froglin: Froglin, index: number) {
    gameEventRef.current.revealedFroglins.splice(index, 1);
    setCapturedFroglins((c) => [...c, froglin]);
  }

  function mapCallback(node: MapRef) {
    if (!node) return;

    if (!location.current) {
      viewLevelRef.current = MAP_VIEWS.WORLD;
      return;
    }

    if (gameEventRef.current.bounds.length === 0) return;

    if (viewLevelRef.current === view) return;

    viewLevelRef.current = view;

    const map = node.getMap();
    setMap(map);

    map.setMinZoom(MAP_VIEWS.WORLD);
    map.setMaxZoom(MAP_VIEWS.PLAYGROUND);
    map.dragPan.disable();
    map.dragRotate.disable();

    if (view === MAP_VIEWS.PLAYGROUND) {
      node.flyTo({
        center: [location.current.longitude, location.current.latitude],
        zoom: MAP_VIEWS.PLAYGROUND,
        pitch: 30,
        bearing: -30,
        duration: durationRef.current,
      });

      map.setMinPitch(20);
      map.setMaxPitch(80);

      setTimeout(() => {
        map.setMinZoom(MAP_VIEWS.PLAYGROUND - 2);
        map.setMaxZoom(MAP_VIEWS.PLAYGROUND);
        map.dragPan.enable();
        map.dragRotate.enable();
        map.scrollZoom.enable();
      }, durationRef.current + 50);

      durationRef.current = 3_000;
    } //
    else if (view === MAP_VIEWS.EVENT) {
      node.fitBounds(gameEventRef.current.getBounds(), {
        animate: true,
        zoom: MAP_VIEWS.EVENT,
        pitch: 30,
        bearing: 30,
        duration: durationRef.current,
      });

      map.setMinPitch(10);
      map.setMaxPitch(40);

      setTimeout(() => {
        map.setMinZoom(MAP_VIEWS.EVENT);
        map.setMaxZoom(MAP_VIEWS.EVENT);
        map.dragRotate.enable();
      }, durationRef.current + 50);
    }
  }

  useEffect(() => {
    clearInterval(epochTickerRef.current);

    if (!location.initial) return;

    gameEventRef.current.initialize(location.initial);

    gameEventRef.current.epochStartTime = Date.now();
    epochTickerRef.current = setInterval(() => {
      const timeLeft =
        gameEventRef.current.epochStartTime +
        gameEventRef.current.epochDuration -
        Date.now();

      setTimeout(() => setCountdownTime(timeLeft), 0);

      if (timeLeft < 1) {
        gameEventRef.current.epochStartTime = Date.now();
        gameEventRef.current.epochCount -= 1;

        if (gameEventRef.current.epochCount === 0) {
          clearInterval(epochTickerRef.current);

          console.log("game ended");
        } //
        else gameEventRef.current.createFroglins();
      }
    }, 1_000);

    return () => {
      clearInterval(epochTickerRef.current);
    };
  }, [location.initial]);

  return (
    <div className="absolute inset-0 h-full w-full">
      <InfoBar
        countdownTime={countdownTime}
        distance={location.metersTravelled}
        froglins={capturedFroglins}
        className="absolute top-2 mx-2 z-10"
      />

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
            <CanvasOverlay coordinates={location.current!} />

            {gameEventRef.current.dormantFroglins.map((location, index) => (
              <FroglinMarker
                key={index}
                location={location}
              />
            ))}
            {gameEventRef.current.revealedFroglins.map((froglin, index) => (
              <FroglinMarker
                key={index}
                location={froglin.coordinates}
                revealed={true}
                froglin={froglin}
              />
            ))}

            <GameEventView
              visible={view === MAP_VIEWS.EVENT}
              game={gameEventRef.current}
            />

            <PlayerMarker
              location={location.current}
              dormantFroglins={gameEventRef.current.dormantFroglins}
              revealedFroglins={gameEventRef.current.revealedFroglins}
              updateRevealed={updateRevealed}
              updateCaught={updateCaught}
            />

            <MyLocationButton
              map={map!}
              location={location.current}
            />
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
