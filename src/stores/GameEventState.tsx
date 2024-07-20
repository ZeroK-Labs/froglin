import { useEffect, useRef, useState } from "react";

import GameEventState from "types/GameEventState";
import { EVENT } from "settings";
import { Froglin, InterestPoint, MapCoordinates, TimeoutId } from "types";
import { LngLatBoundsLike } from "mapbox-gl";
import { StoreFactory, useLocation } from "stores";
import { nullMapCoordinates } from "classes/MapCoordinates";
import { getInterestPoints, getBoundsForCoordinate } from "../../common/utils/map";

function getFarInterestPoints(coords: MapCoordinates, count: number) {
  return getInterestPoints(coords, count, EVENT.FAR_RANGE.FROM, EVENT.FAR_RANGE.TO);
}

function getNearInterestPoints(coords: MapCoordinates, count: number) {
  return getInterestPoints(coords, count, EVENT.NEAR_RANGE.FROM, EVENT.NEAR_RANGE.TO);
}

function getCloseInterestPoints(coords: MapCoordinates, count: number) {
  return getInterestPoints(coords, count, EVENT.CLOSE_RANGE.FROM, EVENT.CLOSE_RANGE.TO);
}

function createState(): GameEventState {
  // console.log("GameEventState createState");

  const epochTickerRef = useRef<TimeoutId>();
  const interestPointsRef = useRef<InterestPoint[]>([]);

  const [location, setLocation] = useState(nullMapCoordinates());
  const [bounds, setBounds] = useState<GeoJSON.Position[][]>([
    [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
  ]);
  const [epochCount, setEpochCount] = useState(EVENT.EPOCH_COUNT);
  const [epochDuration, setEpochDuration] = useState(EVENT.EPOCH_DURATION);
  const [epochStartTime, setEpochStartTime] = useState(0);
  const [interestPoints, setInterestPoints] = useState<InterestPoint[]>(
    Array.from({ length: EVENT.MARKER_COUNT }, (_, i) => ({
      id: "_" + i,
      coordinates: { longitude: 0, latitude: 0 },
    })),
  );
  const [revealedFroglins, setRevealedFroglins] = useState<Froglin[]>([]);
  const [capturedFroglins, setCapturedFroglins] = useState<Froglin[]>([]);

  const playerLocation = useLocation();

  function getEventBounds(): LngLatBoundsLike {
    const root = bounds[0];
    return [root[0], root[2]] as LngLatBoundsLike;
  }

  // ensure operation on the latest interstPoints ref
  interestPointsRef.current = interestPoints;
  function createFroglins(location: MapCoordinates) {
    const totalCount = interestPointsRef.current.length;

    // count visible points
    const newPoints: InterestPoint[] = [];
    for (let i = 0; i !== totalCount; ++i) {
      const oldPoint = interestPointsRef.current[i];

      if (oldPoint.visible === false) continue;

      // for new points, which (by design) are missing the 'visible' property
      oldPoint.visible = true;

      newPoints.push(oldPoint);
    }

    const visibleCount = newPoints.length;
    if (visibleCount === 0) return;

    // generate new coordinates for the interest points
    const nearCount = Math.floor(Math.random() * 12) + 3;
    const closeCount = 5;

    const coordinates: MapCoordinates[] = [
      ...getFarInterestPoints(location, visibleCount - nearCount - closeCount),
      ...getNearInterestPoints(location, nearCount),
      ...getCloseInterestPoints(location, closeCount),
    ];

    // set coordinates in previous (visible) points
    for (let i = 0; i !== visibleCount; ++i) {
      interestPointsRef.current[i].coordinates = coordinates[i];
    }

    setInterestPoints(newPoints);

    // console.log("GameEventState createFroglins", visibleCount);
  }

  function createGameEvent(location: MapCoordinates) {
    // console.log("GameEventState createGameEvent");

    setLocation({ ...location });
    setBounds(getBoundsForCoordinate(location));
    setEpochStartTime(Date.now());
    createFroglins(location);
  }

  function revealFroglins(froglins: Froglin[]) {
    setRevealedFroglins((old) => [...old, ...froglins]);
  }

  function captureFroglins(froglinIds: Froglin["id"][]) {
    setRevealedFroglins((old) => {
      const capturedFroglins: Froglin[] = [];
      const revealedFroglins: Froglin[] = [];

      for (let i = 0; i !== old.length; ++i) {
        const froglin = old[i];

        let captured = false;
        for (let j = 0; j !== froglinIds.length; ++j) {
          const captureId = froglinIds[j];

          if (froglin.id !== captureId) continue;

          froglinIds.pop();
          capturedFroglins.push(froglin);
          captured = true;
          break;
        }
        if (captured) continue;

        revealedFroglins.push(froglin);
      }

      setCapturedFroglins((c) => [...c, ...capturedFroglins]);

      return revealedFroglins;
    });
  }

  useEffect(
    () => {
      if (epochCount === 0 || isNaN(location.longitude)) return;

      epochTickerRef.current = setTimeout(() => {
        // console.log("epoch", location);

        setEpochStartTime((t) => t + epochDuration);
        setEpochCount((e) => e - 1);
        createFroglins(location);

        if (epochCount !== 1) return;

        // console.log("game ended");
      }, epochDuration);

      return () => {
        clearTimeout(epochTickerRef.current);
      };
    }, //
    [epochCount, location],
  );

  // create event
  useEffect(
    () => {
      // console.log("GameEvent - location source", playerLocation.coordinates);

      if (playerLocation.disabled) return;

      createGameEvent(playerLocation.coordinates);
    }, //
    [playerLocation.disabled],
  );

  return {
    bounds,
    setBounds,
    epochCount,
    setEpochCount,
    epochDuration,
    setEpochDuration,
    epochStartTime,
    setEpochStartTime,
    getEventBounds,
    interestPoints,
    setInterestPoints,
    revealedFroglins,
    revealFroglins,
    capturedFroglins,
    captureFroglins,
  };
}

export const { Provider: DemoEventStateProvider, useProvider: useDemoEventState } =
  StoreFactory<GameEventState>(createState);
