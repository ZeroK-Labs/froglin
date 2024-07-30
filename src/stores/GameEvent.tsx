import toast from "react-hot-toast";
import { useEffect, useState } from "react";

import { Froglin, GameEvent } from "types";
import { InterestPoint, MapCoordinates } from "../../common/types";
import { LngLatBoundsLike } from "mapbox-gl";
import { ServerGameEvent } from "../../backend/types";
import { StoreFactory, useLocation } from "stores";
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

  function getEventBounds(): LngLatBoundsLike {
    const root = bounds[0];
    return [root[0], root[2]] as LngLatBoundsLike;
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
        event.interestPoints[i].visible = true;
      }
      setInterestPoints(event.interestPoints);

      setInitialized(true);
      //
    } catch (err) {}
  }

  if (
    !initialized &&
    location.coordinates.longitude &&
    isFinite(location.coordinates.longitude) &&
    location.coordinates.latitude &&
    isFinite(location.coordinates.latitude)
  ) {
    fetchData(location.coordinates);
  }

  useEffect(
    () => {
      function handleServerEpochUpdate(event: MessageEvent<any>) {
        if (event.data === "newEpoch") {
          toast("New epoch", { duration: 3_000, icon: "⏳" });

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
