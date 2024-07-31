import toast from "react-hot-toast";
import { useEffect, useState } from "react";

import { Froglin, GameEvent } from "types";
import { InterestPoint, MapCoordinates } from "../../common/types";
import { ServerGameEvent } from "../../backend/types";
import { StoreFactory, useLocation, usePXEClient } from "stores";
import {
  CLIENT_SOCKET,
  PLAYER_ID,
  addSocketEventHandler,
  removeSocketEventHandler,
} from "utils/sockets";

function createState(): GameEvent {
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

  function getEventBounds(): [[number, number], [number, number]] {
    const root = bounds[0];
    return [root[0] as [number, number], root[2] as [number, number]];
  }

  function revealFroglins(froglins: Froglin[]) {
    setRevealedFroglins((old) => {
      for (let i = 0; i !== froglins.length; ++i) {
        const froglin = froglins[i];

        if (old.find((f) => f.id === froglin.id)) continue;

        old.push(froglin);
      }

      if (CLIENT_SOCKET.readyState !== WebSocket.OPEN) return [...old];

      try {
        fetch(`${process.env.BACKEND_URL}/reveal`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            playerId: PLAYER_ID,
            hiddenInterestPointIds: froglins.map((point) => point.id),
          }),
        });
        //
      } catch (err) {}

      return [...old];
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
          capturedFroglinsNew.push({ ...froglin, id: crypto.randomUUID() });

          continue OUTER_LOOP;
        }

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

      for (let i = 0; i !== event.interestPoints.length; ++i) {
        const point = event.interestPoints[i];

        // can have overlap on reveal and new epoch, explicitly filter out
        if (revealedFroglins.find((f) => f.id === point.id)) continue;

        point.visible = true;
      }
      setInterestPoints(event.interestPoints);

      setInitialized(true);
      //
    } catch (err) {}
  }

  // handle event initialization
  useEffect(
    () => {
      if (!pxeClient) setInitialized(false);
      else if (
        !initialized &&
        location.coordinates.longitude &&
        isFinite(location.coordinates.longitude) &&
        location.coordinates.latitude &&
        isFinite(location.coordinates.latitude)
      ) {
        fetchData(location.coordinates);
      }
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
      if (epochCount !== 0) return;

      return () => {
        if (!initialized) return;

        toast("Event restarted", { duration: 3_000, icon: "🎉" });
        setRevealedFroglins([]);
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
    setInterestPoints,
    revealedFroglins,
    revealFroglins,
    capturedFroglins,
    captureFroglins,
  };
}

export const { Provider: GameEventProvider, useProvider: useGameEvent } =
  StoreFactory<GameEvent>(createState);
