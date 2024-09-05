import toast from "react-hot-toast";
import { useEffect, useRef, useState } from "react";

import type { Froglin } from "frontend/types";
import type { GameEventClient, InterestPoint } from "common/types";
import { FROGLIN, PLAYER } from "frontend/settings";
import { StoreFactory, useLocation, usePlayer } from "frontend/stores";
import { inRange } from "common/utils/map";
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
  const epochCountRef = useRef(0);
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
  // const [capturing, setCapturing] = useState<boolean>(false);

  const location = useLocation();
  const { aztec, registered } = usePlayer();

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
        type: getRandomInRange(0, FROGLIN.TYPE_COUNT - 1),
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

  async function captureFroglins(froglinIds: Froglin["id"][]) {
    if (!aztec || !registered) return;
    // remove captured from the list of revealed Froglins
    setRevealedFroglins((oldRevealed) =>
      oldRevealed.filter((froglin) => !froglinIds.includes(froglin.id)),
    );

    const froglinsToCapture = revealedFroglins.filter((froglin) =>
      froglinIds.includes(froglin.id),
    );

    for (let i = 0; i !== froglinsToCapture.length; ++i) {
      const froglin = froglinsToCapture[i];

      const toastId = toast.loading("Capturing Froglin...");

      // setCapturing(true);
      try {
        await aztec.contracts.gateway.methods
          .capture_froglin(froglin.type)
          .send()
          .wait();
        //
      } catch (error) {
        toast.error("Failed to capture Froglin!", { id: toastId });
        console.error("Error capturing Froglin:", error);
      }
      // setCapturing(false);

      toast.success("Froglin captured!", { id: toastId });

      setCapturedFroglins((oldCaptured) => [
        ...oldCaptured,
        { ...froglin, id: crypto.randomUUID(), visible: false },
      ]);

      // delay removal from revealed list to allow fade animation to complete
      setTimeout(setRevealedFroglins, FROGLIN.MARKER.TRANSITION_DURATION, (old) =>
        old.filter((r) => r.id !== froglin.id),
      );
    }
  }

  function fetchBlockchainData() {
    if (!aztec || !registered) return;

    aztec.contracts.gateway.methods
      .view_epoch_duration()
      .simulate()
      .then((epoch_duration) => {
        setEpochDuration(Number(epoch_duration));
      });

    aztec.contracts.gateway.methods
      .view_epoch_count()
      .simulate()
      .then((epoch_count) => {
        epoch_count = Number(epoch_count);

        epochCountRef.current = epoch_count;
        setEpochCount(epoch_count);

        const suffix = epoch_count === 1 ? "" : "s";
        toast(`${epoch_count} epoch${suffix} left`, { icon: "⏳" });
      });

    aztec.contracts.gateway.methods
      .view_epoch_start_time()
      .simulate()
      .then((epoch_start_time) => setEpochStartTime(Number(epoch_start_time)));
  }

  async function fetchWebServerData() {
    if (CLIENT_SOCKET.readyState !== WebSocket.OPEN) return;

    const query = new URLSearchParams({ sessionId: SESSION_ID });

    let interestPoints: InterestPoint[];
    try {
      const response = await fetch(
        `${process.env.BACKEND_URL}/interest-points?${query}`,
      );
      interestPoints = await response.json();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
      return;
    }

    for (let i = 0; i !== interestPoints.length; ++i) {
      interestPoints[i].visible = true;
    }

    setInterestPoints(interestPoints);

    let bounds: [number, number][][];
    try {
      const response = await fetch(`${process.env.BACKEND_URL}/event-bounds?${query}`);
      bounds = await response.json();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
      return;
    }
    setBounds(bounds);

    if (epochCountRef.current !== 1) return;

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

  useEffect(
    () => {
      if (CLIENT_SOCKET.readyState !== WebSocket.OPEN) return;

      if (
        location.coordinates.longitude == null ||
        isNaN(location.coordinates.longitude) ||
        location.coordinates.latitude == null ||
        isNaN(location.coordinates.latitude)
      ) {
        return;
      }

      async function initializeEventLocation() {
        await fetch(`${process.env.BACKEND_URL}/location`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId: SESSION_ID,
            longitude: location.coordinates.longitude,
            latitude: location.coordinates.latitude,
          }),
        });
      }

      initializeEventLocation();
    }, //
    [location.coordinates, CLIENT_SOCKET.readyState],
  );

  // handle event initialization
  useEffect(
    () => {
      if (!registered) return;

      function handleServerEpochUpdate(event: MessageEvent<any>) {
        if (!aztec || !aztec.wallet || event.data !== "newEpoch") return;

        fetchBlockchainData();
        fetchWebServerData();
      }

      fetchBlockchainData();
      fetchWebServerData();

      addSocketEventHandler("message", handleServerEpochUpdate);

      return () => {
        removeSocketEventHandler("message", handleServerEpochUpdate);
      };
    }, //
    [registered],
  );

  return {
    bounds,
    getEventBounds,
    epochCount,
    epochDuration,
    epochStartTime,
    interestPoints,
    revealedFroglins,
    revealFroglins,
    // capturing,
    capturedFroglins,
    captureFroglins,
  };
}

export const { Provider: GameEventProvider, useProvider: useGameEvent } =
  StoreFactory<GameEventClient>(createState);
