import mapboxgl from "mapbox-gl";
import { Map, MapRef } from "react-map-gl";
import { useEffect, useRef, useState } from "react";

import { CircleIndicatorPropsProvider } from "providers/CircleIndicatorProps";
import { GameEvent, MapCoordinates, Froglin } from "types";
import { MAP_VIEWS } from "enums";
import { createGameEvent } from "mocks";
import { useKeyboardLocation, useLocation } from "hooks";
import {
  LineMenu,
  CanvasOverlay,
  FroglinMarker,
  GameEventView,
  PlaygroundViewInfoBar,
  LocationRestoreButton,
  PlayerMarker,
  EventViewInfoBar,
} from "components";
import { mobileClient } from "utils/window";

export default function MapScreen() {
  const gameEventRef = useRef<GameEvent>(createGameEvent());
  const epochTickerRef = useRef<ReturnType<typeof setInterval>>();
  const durationRef = useRef(7_000);
  const viewLevelRef = useRef(MAP_VIEWS.WORLD);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [secondsLeftInEpoch, setSecondsLeftInEpoch] = useState(0);
  const [view, setView] = useState(MAP_VIEWS.PLAYGROUND);
  const [revealedFroglins, setRevealedFroglins] = useState<Froglin[]>([]);
  const [capturedFroglins, setCapturedFroglins] = useState<Froglin[]>([]);

  const location = mobileClient ? useLocation() : useKeyboardLocation();

  function updateRevealed(
    newlyRevealedFroglins: Froglin[],
    remainingFroglins: MapCoordinates[],
  ) {
    setRevealedFroglins((r) => [...r, ...newlyRevealedFroglins]);
    gameEventRef.current.dormantFroglins = remainingFroglins;
  }

  function updateCaught(froglinId: number) {
    setRevealedFroglins((revealedFroglins) => {
      const newRevealedFroglins: Froglin[] = [];
      for (const f of revealedFroglins) {
        if (f.id === froglinId) {
          setCapturedFroglins((c) => [...c, { ...f }]);
          f.coordinates.longitude = f.coordinates.latitude = 0;
        }
        newRevealedFroglins.push(f);
      }
      return newRevealedFroglins;
    });
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

    map.setMinPitch(0);
    map.setMaxPitch(85);
    map.setMinZoom(MAP_VIEWS.WORLD);
    map.setMaxZoom(MAP_VIEWS.PLAYGROUND);
    map.dragPan.disable();
    map.dragRotate.disable();
    map.scrollZoom.disable();
    map.touchPitch.disable();
    map.touchZoomRotate.disable();

    if (view === MAP_VIEWS.PLAYGROUND) {
      node.flyTo({
        center: [location.current.longitude, location.current.latitude],
        zoom: MAP_VIEWS.PLAYGROUND,
        pitch: 30,
        bearing: -30,
        duration: durationRef.current,
      });

      map.once("idle", () => {
        if (viewLevelRef.current !== MAP_VIEWS.PLAYGROUND) return;

        map.setMinPitch(20);
        map.setMaxPitch(80);
        map.setMinZoom(MAP_VIEWS.PLAYGROUND - 2);
        map.setMaxZoom(MAP_VIEWS.PLAYGROUND);
        map.dragPan.enable();
        map.dragRotate.enable();
        map.scrollZoom.enable();
        map.touchPitch.enable();
        map.touchZoomRotate.enable();
      });

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

      map.once("idle", () => {
        if (viewLevelRef.current !== MAP_VIEWS.EVENT) return;

        map.setMinPitch(10);
        map.setMaxPitch(40);
        map.setMinZoom(MAP_VIEWS.EVENT);
        map.setMaxZoom(MAP_VIEWS.EVENT);
        map.dragRotate.enable();
        map.touchZoomRotate.enable();
      });
    }
  }

  useEffect(() => {
    clearInterval(epochTickerRef.current);

    if (!location.initial) return;

    gameEventRef.current.initialize(location.initial);

    gameEventRef.current.epochStartTime = Date.now();
    epochTickerRef.current = setInterval(() => {
      let timeLeft =
        gameEventRef.current.epochStartTime +
        gameEventRef.current.epochDuration -
        Date.now();

      if (timeLeft < 1) {
        gameEventRef.current.epochCount -= 1;

        if (gameEventRef.current.epochCount === 0) {
          timeLeft = 0;
          clearInterval(epochTickerRef.current);

          console.log("game ended");
        } //
        else {
          gameEventRef.current.epochStartTime = Date.now();
          timeLeft = Math.floor(
            gameEventRef.current.epochDuration / 1_000 + 0.5,
          );

          gameEventRef.current.createFroglins();
        }
      } //

      setSecondsLeftInEpoch(Math.floor(timeLeft / 1_000 + 0.5));
    }, 1_000);

    return () => {
      clearInterval(epochTickerRef.current);
    };
  }, [location.initial]);

  useEffect(() => {
    if (!(map && location.current)) return;

    map.flyTo({
      center: [location.current.longitude, location.current.latitude],
      duration: 1_000,
    });
  }, [location.current?.longitude, location.current?.latitude]);

  return (
    <div className="fixed inset-0 h-full w-full">
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
      >
        {location.current ? (
          <CircleIndicatorPropsProvider>
            <CanvasOverlay coordinates={location.current} />

            {gameEventRef.current.dormantFroglins.map((location, index) => (
              <FroglinMarker
                key={index}
                location={location}
              />
            ))}
            {revealedFroglins.map((froglin, index) => (
              <FroglinMarker
                key={index}
                location={froglin.coordinates}
                froglin={froglin}
                updateCaught={updateCaught}
              />
            ))}

            <GameEventView
              visible={view === MAP_VIEWS.EVENT}
              game={gameEventRef.current}
            />

            <PlayerMarker
              location={location.current}
              dormantFroglins={gameEventRef.current.dormantFroglins}
              revealedFroglins={revealedFroglins}
              updateRevealed={updateRevealed}
              updateCaught={updateCaught}
            />

            <LocationRestoreButton
              map={map}
              location={location.current}
            />
          </CircleIndicatorPropsProvider>
        ) : null}
      </Map>

      <div className="absolute left-0 top-2 right-0 p-2 flex">
        {view === MAP_VIEWS.PLAYGROUND ? (
          <PlaygroundViewInfoBar
            secondsLeft={secondsLeftInEpoch}
            distance={location.metersTravelled}
            froglins={capturedFroglins}
          />
        ) : view === MAP_VIEWS.EVENT ? (
          <EventViewInfoBar />
        ) : null}
      </div>

      <LineMenu
        view={view}
        setView={setView}
      />
    </div>
  );
}
