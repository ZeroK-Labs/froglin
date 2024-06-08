import { Map, MapRef, useMap } from "react-map-gl";
import { useEffect, useRef, useState } from "react";

import {
  BurgerMenu,
  CanvasOverlay,
  FroglinMarker,
  GameEventView,
  PlayerMarker,
  InfoBar,
} from "components";
import { GameEvent, MapCoordinates } from "types";
import { MAP_VIEWS } from "enums";
import { useLocation } from "hooks";
import { getDistance } from "utils/get-distance";
import {
  createGameEvent,
  generateCloseFroglinsCoordinates,
  generateEventBounds,
  generateSpreadOutFroglinsCoordinates,
} from "mocks";

const FLUTE_RADIUS = 50;
const CAPTURE_RADIUS = 50;

export default function MapScreen() {
  const gameEventRef = useRef<GameEvent>(createGameEvent());
  const tickerRef = useRef<ReturnType<typeof setInterval>>();
  const durationRef = useRef(7_000);
  const zoomLevelRef = useRef(MAP_VIEWS.WORLD);
  const [view, setView] = useState(MAP_VIEWS.PLAYGROUND);
  const [countdownTime, setCountdownTime] = useState<number>(0);
  const [revealedFroglins, setRevealedFroglins] = useState<MapCoordinates[]>(
    [],
  );
  const [capturedFroglins, setCapturedFroglins] = useState<number>(0);
  const [mode, setMode] = useState<"flute" | "capture">("flute");

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

    map!.setMinZoom(0);
    map!.setMaxZoom(21);
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
        map!.setMinZoom(17.25);
        map!.setMaxZoom(18);
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
        map!.setMinZoom(15);
        map!.setMaxZoom(15);
        map!.dragRotate.enable();
      }, durationRef.current);
    }
  }

  useEffect(() => {
    function createFroglins() {
      gameEventRef.current.froglinCoordinates = [
        ...generateSpreadOutFroglinsCoordinates(gameEventRef.current.location),
        ...generateCloseFroglinsCoordinates(gameEventRef.current.location),
      ];
    }

    gameEventRef.current.bounds = generateEventBounds(
      gameEventRef.current.location,
    );
    createFroglins();

    clearInterval(tickerRef.current);
    gameEventRef.current.startTime = Date.now();
    tickerRef.current = setInterval(() => {
      const diff = Date.now() - gameEventRef.current.startTime;
      const timeLeft = gameEventRef.current.timePerEpoch - diff;

      setCountdownTime(timeLeft);
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
  useEffect(() => {
    if (mode === "capture") {
      revealedFroglins.forEach((froglin) => {
        if (inRange([froglin.longitude, froglin.latitude], location.current!)) {
          setCapturedFroglins((prev) => prev + 1);
          setRevealedFroglins((prev) => prev.filter((f) => f !== froglin));
        }
      });
    }
  }, [location.current, mode, revealedFroglins]);

  function inRange(coordinates: [number, number], location: MapCoordinates) {
    return (
      getDistance(
        coordinates[1], // latitude
        location.latitude,
        coordinates[0], // longitude
        location.longitude,
      ) <= (mode === "flute" ? FLUTE_RADIUS : CAPTURE_RADIUS)
    );
  }
  function handleFlute() {
    setMode("flute");
    const allFroglins = gameEventRef.current.froglinCoordinates;
    const inRangeFroglins = allFroglins.filter((froglins) =>
      inRange([froglins.longitude, froglins.latitude], location.current!),
    );

    if (inRangeFroglins.length === 0) return;

    let emptyFroglinSpot: MapCoordinates[] = [];

    inRangeFroglins.forEach((froglin) => {
      if (Math.random() < 0.5) {
        setRevealedFroglins((prev) => [...prev, froglin]);
        emptyFroglinSpot.push(froglin);
      } else {
        emptyFroglinSpot.push(froglin);
      }
    });

    gameEventRef.current.froglinCoordinates =
      gameEventRef.current.froglinCoordinates.filter(
        (froglin) => !emptyFroglinSpot.includes(froglin),
      );
  }

  function handleCapture() {
    if (mode === "capture") {
      setMode("flute");
    } else {
      setMode("capture");
    }
  }

  return (
    <div className="fixed left-0 top-0 h-full w-full">
      <InfoBar
        countdownTime={countdownTime}
        distance={location.distance}
        className="absolute top-2 mx-2 z-10"
      />
      <CapturesFroglins
        count={capturedFroglins}
        className="absolute top-20 mx-10 z-10"
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
            <CanvasOverlay
              coordinates={location.initial!}
              mode={mode}
            />
            {gameEventRef.current.froglinCoordinates.map((location, index) => (
              <FroglinMarker
                key={index}
                location={location}
              />
            ))}
            {revealedFroglins.map((location, index) => (
              <FroglinMarker
                key={index}
                location={location}
                revealed={true}
              />
            ))}

            <GameEventView
              visible={view === MAP_VIEWS.EVENT}
              game={gameEventRef.current}
            />

            <PlayerMarker
              location={location.current}
              handleFlute={handleFlute}
              handleCapture={handleCapture}
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

function CapturesFroglins({
  count = 0,
  className,
}: {
  count: number;
  className: string;
}) {
  return (
    <div className={`flex flex-row ${className}`}>
      {Array.from({ length: count }).map((count) => (
        <img
          src="/images/froglin2.png"
          width="30"
          height="30"
          alt=""
        />
      ))}
    </div>
  );
}
