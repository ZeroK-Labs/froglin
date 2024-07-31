import toast from "react-hot-toast";
import { useEffect, useRef, useState } from "react";

import { FROGLIN, PLAYER } from "settings";
import { Froglin, GameEvent } from "types";
import { InterestPoint, MapCoordinates } from "../../common/types";
import { ServerGameEvent } from "../../backend/types";
import { StoreFactory, useLocation, usePXEClient } from "stores";
import { inRange } from "../../common/utils/map";
import {
  CLIENT_SOCKET,
  PLAYER_ID,
  addSocketEventHandler,
  removeSocketEventHandler,
} from "utils/sockets";

function getRandomInRange(a: number, b: number): number {
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function createState(): GameEvent {
  const interestPointsRef = useRef<InterestPoint[]>([]);
  const revealedInterestPointsRef = useRef<InterestPoint[]>([]);
  const hiddenInterestPointIdsRef = useRef<InterestPoint["id"][]>([]);
  const revealingRef = useRef(false);

  const [bounds, setBounds] = useState<GeoJSON.Position[][]>([
    [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
  ]);
  const [epochCount, setEpochCount] = useState(0);
  const [epochDuration, setEpochDuration] = useState(0);
  const [epochStartTime, setEpochStartTime] = useState(0);
  const [interestPoints, setInterestPoints] = useState<InterestPoint[]>([]);
  const [revealedFroglins, setRevealedFroglins] = useState<Froglin[]>([]);
  const [capturedFroglins, setCapturedFroglins] = useState<Froglin[]>([]);
  const [initialized, setInitialized] = useState(false);

  const location = useLocation();
  const { pxeClient } = usePXEClient();

  interestPointsRef.current = interestPoints;

  function getEventBounds(): [[number, number], [number, number]] {
    const root = bounds[0];
    return [root[0] as [number, number], root[2] as [number, number]];
  }

  function cacheRevealedInterestPoints() {
    revealedInterestPointsRef.current = [];
    for (let i = 0; i !== interestPointsRef.current.length; ++i) {
      const point = interestPointsRef.current[i];
      if (
        point.visible &&
        inRange(point.coordinates, location.coordinates, PLAYER.REVEAL.RADIUS)
      ) {
        revealedInterestPointsRef.current.push(point);
      }
    }
  }

  function revealFroglins(radius: number) {
    if (!revealingRef.current) {
      revealingRef.current = true;
      cacheRevealedInterestPoints();
    }

    // reveal Froglins based on current circle size
    const froglins: Froglin[] = [];
    const hiddenInterestPointIds: InterestPoint["id"][] = [];

    for (let i = 0; i !== revealedInterestPointsRef.current.length; ++i) {
      const point = revealedInterestPointsRef.current[i];

      if (!point.visible || !inRange(point.coordinates, location.coordinates, radius)) {
        continue;
      }

      // skip captured points (can happen when epoch changes between reveal steps)
      if (hiddenInterestPointIdsRef.current.find((id) => id === point.id)) continue;

      // hide the point to start fade out animation
      point.visible = false;

      hiddenInterestPointIds.push(point.id);
      hiddenInterestPointIdsRef.current.push(point.id);

      // send some markers to the void
      const gone = Math.random();
      if (gone < 0.25 || gone > 0.75) continue;

      // create a Froglin
      froglins.push({
        id: "R" + point.id,
        coordinates: point.coordinates,
        visible: true,
        type: getRandomInRange(2, 7),
      });
    }

    // mark done when last step of reveal complete
    if (radius === PLAYER.REVEAL.RADIUS) {
      revealingRef.current = false;
      hiddenInterestPointIdsRef.current = [];
    }

    if (hiddenInterestPointIds.length === 0) return;

    // update state of interest points to hide them all in one go
    setInterestPoints([...interestPointsRef.current]);

    if (CLIENT_SOCKET.readyState === WebSocket.OPEN) {
      try {
        fetch(`${process.env.BACKEND_URL}/reveal`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            playerId: PLAYER_ID,
            hiddenInterestPointIds,
          }),
        });
        //
      } catch (err) {}
    }

    if (froglins.length === 0) return;

    // pause between hiding and revealing
    setTimeout(setRevealedFroglins, FROGLIN.MARKER.TRANSITION_DURATION, (old) => {
      return [...old, ...froglins];
    });
  }

  function captureFroglins(froglinIds: Froglin["id"][]) {
    setRevealedFroglins((old) => {
      const capturedFroglinsNew: Froglin[] = [];
      const revealedFroglinsNew: Froglin[] = [];

      // prettier-ignore
      OUTER_LOOP:
      for (let i = 0; i !== old.length; ++i) {
        const froglin = old[i];

        for (let j = 0; j !== froglinIds.length; ++j) {
          const captureId = froglinIds[j];

          if (froglin.id !== captureId) continue;

          froglinIds.slice(j, 1);
          froglin.id = crypto.randomUUID();
          froglin.visible = false;
          capturedFroglinsNew.push(froglin);

          continue OUTER_LOOP;
        }

        froglin.visible = true;
        revealedFroglinsNew.push(froglin);
      }

      setCapturedFroglins((old) => [...old, ...capturedFroglinsNew]);

      return revealedFroglinsNew;
    });
  }

  async function fetchData(coordinates?: MapCoordinates) {
    if (CLIENT_SOCKET.readyState !== WebSocket.OPEN) return;

    if (!PLAYER_ID) {
      console.error("Failed to fetch game event data: missing PLAYER_ID");

      return;
    }

    const query = new URLSearchParams({ playerId: PLAYER_ID });
    if (coordinates) {
      query.set("longitude", coordinates.longitude.toString());
      query.set("latitude", coordinates.latitude.toString());
    }

    try {
      const response = await fetch(`${process.env.BACKEND_URL}/game?${query}`);
      const event: ServerGameEvent = await response.json();

      setBounds(event.bounds);
      setEpochCount(event.epochCount);
      setEpochDuration(event.epochDuration);
      setEpochStartTime(event.epochStartTime);

      if (revealingRef.current) {
        interestPointsRef.current = event.interestPoints;
        cacheRevealedInterestPoints();
      }

      for (let i = 0; i !== event.interestPoints.length; ++i) {
        const point = event.interestPoints[i];
        point.visible = !hiddenInterestPointIdsRef.current.find(
          (id) => id === point.id,
        );
      }

      setInterestPoints(event.interestPoints);
      //
    } catch (err) {}
  }

  async function initializeEvent() {
    if (
      location.coordinates.longitude &&
      isFinite(location.coordinates.longitude) &&
      location.coordinates.latitude &&
      isFinite(location.coordinates.latitude)
    ) {
      await fetchData(location.coordinates);

      setInitialized(true);
    }
  }

  // handle event initialization
  useEffect(
    () => {
      setInitialized(!pxeClient);
      if (pxeClient) initializeEvent();
    }, //
    [pxeClient],
  );

  // handle server new epoch message
  useEffect(
    () => {
      function handleServerEpochUpdate(event: MessageEvent<any>) {
        if (event.data === "newEpoch") {
          toast("New epoch ", { duration: 3_000, icon: "⏳" });

          fetchData();
        }
      }

      addSocketEventHandler("message", handleServerEpochUpdate);

      return () => {
        removeSocketEventHandler("message", handleServerEpochUpdate);
      };
    }, //
    [initialized],
  );

  // reset revealed Froglins when event restarts
  useEffect(
    () => {
      if (!initialized || epochCount !== 0) return;

      return () => {
        setRevealedFroglins([]);

        toast("Event restarted", { duration: 3_000, icon: "🎉" });
      };
    }, //
    [epochCount],
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
    revealedFroglins,
    revealFroglins,
    capturedFroglins,
    captureFroglins,
  };
}

export const { Provider: GameEventProvider, useProvider: useGameEvent } =
  StoreFactory<GameEvent>(createState);
