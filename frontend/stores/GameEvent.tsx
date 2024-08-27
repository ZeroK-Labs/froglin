import toast from "react-hot-toast";
import { useEffect, useRef, useState } from "react";

import type { Froglin } from "frontend/types";
import { FROGLIN, PLAYER } from "frontend/settings";
import { StoreFactory, useLocation, usePlayer, usePXEState } from "frontend/stores";
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
} from "frontend/utils/sockets";

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
  const { aztec } = usePlayer();

  interestPointsRef.current = interestPoints;

  function getEventBounds(): [[number, number], [number, number]] {
    return [bounds[0][0], bounds[0][2]];
  }

  function cacheInterestPointsToReveal() {
    const hiddenInterestPointIds: InterestPoint["id"][] = [];
    revealedInterestPointsRef.current = [];
    for (let i = 0; i !== interestPointsRef.current.length; ++i) {
      const point = interestPointsRef.current[i];
      if (
        point.visible &&
        inRange(point.coordinates, location.coordinates, PLAYER.REVEAL.RADIUS)
      ) {
        revealedInterestPointsRef.current.push(point);
        hiddenInterestPointIds.push(point.id);
      }
    }

    if (hiddenInterestPointIds.length === 0) return;

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
  }

  function revealFroglins(radius: number) {
    if (!revealingRef.current) {
      revealingRef.current = true;
      cacheInterestPointsToReveal();
    }

    // reveal Froglins based on current radius
    const froglins: Froglin[] = [];

    for (let i = 0; i !== revealedInterestPointsRef.current.length; ++i) {
      const point = revealedInterestPointsRef.current[i];

      if (!point.visible || !inRange(point.coordinates, location.coordinates, radius)) {
        continue;
      }

      // hide the point to start fade out animation
      point.visible = false;

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

    // update state of interest points to hide them all in one go
    setInterestPoints([...interestPointsRef.current]);

    if (froglins.length === 0) return;

    // pause between hiding and revealing
    setTimeout(setRevealedFroglins, FROGLIN.MARKER.TRANSITION_DURATION, (old) => {
      return [...old, ...froglins];
    });
  }

  function captureFroglins(froglinIds: Froglin["id"][]) {
    const froglinsToCapture = revealedFroglins.filter((froglin) =>
      froglinIds.includes(froglin.id),
    );

    froglinsToCapture.forEach((froglin) => {
      const toastId = toast.loading("Capturing Froglin...");

      aztec?.contracts.gateway.methods
        .capture_froglin(froglin.type)
        .send()
        .wait()
        .then(() => {
          toast.dismiss(toastId);
          toast.success("Froglin captured!");

          setCapturedFroglins((oldCaptured) => [
            ...oldCaptured,
            { ...froglin, id: crypto.randomUUID(), visible: false },
          ]);
          // delay removal from revealed list to allow fade animation to complete
          setTimeout(() => {
            setRevealedFroglins((old) => old.filter((r) => r.id !== froglin.id));
          }, FROGLIN.MARKER.TRANSITION_DURATION);
        })
        .catch((error) => {
          toast.dismiss(toastId);
          toast.error("Failed to capture Froglin!");
          console.error("Error capturing Froglin:", error);
        });
    });

    // Remove Froglins from the list of revealed Froglins
    setRevealedFroglins((oldRevealed) =>
      oldRevealed.filter((froglin) => !froglinIds.includes(froglin.id)),
    );
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

    let event: GameEventBase;
    try {
      const response = await fetch(`${process.env.BACKEND_URL}/game?${query}`);
      event = await response.json();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
      return;
    }

    const restarted = epochCountRef.current === 0;
    epochCountRef.current = event.epochCount;

    for (let i = 0; i !== event.interestPoints.length; ++i) {
      event.interestPoints[i].visible = true;
    }

    setBounds(event.bounds);
    setEpochCount(event.epochCount);
    setEpochDuration(event.epochDuration);
    setEpochStartTime(event.epochStartTime);
    setInterestPoints(event.interestPoints);

    if (!restarted) {
      const suffix = event.epochCount === 0 ? "" : "s";
      toast(`${event.epochCount + 1} epoch${suffix} left`, { icon: "⏳" });

      return;
    }

    // hide revealed Froglins
    setRevealedFroglins((old) => {
      return old.map((point) => ({
        ...point,
        visible: false,
      }));
    });

    // delay for the fade animation to complete; clear revealed Froglins
    setTimeout(setRevealedFroglins, FROGLIN.MARKER.TRANSITION_DURATION, []);

    toast("New event", { icon: "🎉" });
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
