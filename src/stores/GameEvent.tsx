import toast from "react-hot-toast";
import { useEffect, useRef, useState } from "react";

import { FROGLIN, PLAYER } from "src/settings";
import { Froglin } from "src/types";
import { StoreFactory, useLocation, usePXEState } from "src/stores";
import { inRange } from "common/utils/map";
import {
  GameEventBase,
  GameEventClient,
  InterestPoint,
  MapCoordinates,
} from "common/types";
import {
  CLIENT_SOCKET,
  SESSION_ID,
  addSocketEventHandler,
  removeSocketEventHandler,
} from "src/utils/sockets";

function getRandomInRange(a: number, b: number): number {
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function createState(): GameEventClient {
  const interestPointsRef = useRef<InterestPoint[]>([]);
  const revealedInterestPointsRef = useRef<InterestPoint[]>([]);
  const epochCountRef = useRef(-1);
  const revealingRef = useRef(false);

  const [bounds, setBounds] = useState<[number, number][][]>([
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

  const location = useLocation();
  const { pxeClient } = usePXEState();

  interestPointsRef.current = interestPoints;

  function getEventBounds(): [[number, number], [number, number]] {
    const root = bounds[0];
    return [root[0] as [number, number], root[2] as [number, number]];
  }

  function cacheInterestPointsToReveal() {
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
      cacheInterestPointsToReveal();
    }

    // reveal Froglins based on current radius
    const froglins: Froglin[] = [];
    const hiddenInterestPointIds: InterestPoint["id"][] = [];

    for (let i = 0; i !== revealedInterestPointsRef.current.length; ++i) {
      const point = revealedInterestPointsRef.current[i];

      if (!point.visible || !inRange(point.coordinates, location.coordinates, radius)) {
        continue;
      }

      // hide the point to start fade out animation
      point.visible = false;
      hiddenInterestPointIds.push(point.id);

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
    revealingRef.current = radius === PLAYER.REVEAL.RADIUS;

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
            sessionId: SESSION_ID,
            hiddenInterestPointIds,
          }),
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_err) {}
    }

    if (froglins.length === 0) return;

    // pause between hiding and revealing
    setTimeout(setRevealedFroglins, FROGLIN.MARKER.TRANSITION_DURATION, (old) => {
      return [...old, ...froglins];
    });
  }

  function captureFroglins(froglinIds: Froglin["id"][]) {
    setRevealedFroglins((old) => {
      // copy captured from revealed and set invisibile
      const capturedFroglinsNew: Froglin[] = [];
      for (let i = 0; i !== old.length; ++i) {
        const froglin = old[i];

        if (froglinIds.indexOf(froglin.id) === -1) continue;

        capturedFroglinsNew.push({ ...froglin, id: crypto.randomUUID() });
        froglin.visible = false;
      }

      setCapturedFroglins((old) => [...old, ...capturedFroglinsNew]);

      setTimeout(setRevealedFroglins, FROGLIN.MARKER.TRANSITION_DURATION, (old) => {
        // delay removal from revealed list to allow fade animation to complete
        const revealedFroglinsNew: Froglin[] = [];
        for (let i = 0; i !== old.length; ++i) {
          const froglin = old[i];

          const index = froglinIds.indexOf(froglin.id);
          if (index === -1) revealedFroglinsNew.push(froglin);
          else froglinIds.slice(index, 1);
        }

        return revealedFroglinsNew;
      });

      // update state to hide revealed and start fade animation
      return [...old];
    });
  }

  async function fetchData(coordinates?: MapCoordinates) {
    if (CLIENT_SOCKET.readyState !== WebSocket.OPEN) return;

    if (!SESSION_ID) {
      console.error("Failed to fetch game event data: missing SESSION_ID");

      return;
    }

    const query = new URLSearchParams({ sessionId: SESSION_ID });
    if (coordinates) {
      query.set("longitude", coordinates.longitude.toString());
      query.set("latitude", coordinates.latitude.toString());
    }

    try {
      const response = await fetch(`${process.env.BACKEND_URL}/game?${query}`);
      const event: GameEventBase = await response.json();

      const restarted = epochCountRef.current === 0;
      epochCountRef.current = event.epochCount;

      if (revealingRef.current) {
        interestPointsRef.current = event.interestPoints;
        cacheInterestPointsToReveal();
      }

      for (let i = 0; i !== event.interestPoints.length; ++i) {
        const point = event.interestPoints[i];
        point.visible = true;
      }

      setBounds(event.bounds);
      setEpochCount(event.epochCount);
      setEpochDuration(event.epochDuration);
      setEpochStartTime(event.epochStartTime);

      if (!restarted) {
        setInterestPoints(event.interestPoints);

        const suffix = event.epochCount === 0 ? "" : "s";
        const msg = `${event.epochCount + 1} epoch${suffix} left`;
        toast(msg, { icon: "⏳" });

        return;
      }

      setRevealedFroglins([]);

      // TODO: direct call of setInterestPoints here leads to rendering of phantom
      //       interestPoints when event is restarted

      // hide the old points
      setInterestPoints((old) => {
        return old.map((point) => ({
          ...point,
          visible: false,
        }));
      });

      // delay for the fade animation to complete and set the new points
      setTimeout(
        setInterestPoints,
        FROGLIN.MARKER.TRANSITION_DURATION,
        event.interestPoints,
      );

      toast("New event", { icon: "🎉" });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {}
  }

  // handle event initialization
  useEffect(
    () => {
      if (!pxeClient) return;

      function handleServerEpochUpdate(event: MessageEvent<any>) {
        if (event.data === "newEpoch") fetchData();
      }

      async function initializeEvent() {
        if (
          location.coordinates.longitude != null &&
          isFinite(location.coordinates.longitude) &&
          location.coordinates.latitude != null &&
          isFinite(location.coordinates.latitude)
        ) {
          await fetchData(location.coordinates);

          addSocketEventHandler("message", handleServerEpochUpdate);
        }
      }
      initializeEvent();

      return () => {
        removeSocketEventHandler("message", handleServerEpochUpdate);
      };
    }, //
    [pxeClient],
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
  StoreFactory<GameEventClient>(createState);
