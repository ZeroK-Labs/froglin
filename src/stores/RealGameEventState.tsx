import { useEffect, useState } from "react";

import { Froglin, InterestPoint } from "types";
import { LngLatBoundsLike } from "mapbox-gl";
import { StoreFactory } from "stores";
import { ServerGameEventState } from "../../backend/GameEventState";

type GameEventStateTemporar = {
  bounds: GeoJSON.Position[][];
  setBounds: React.Dispatch<React.SetStateAction<GeoJSON.Position[][]>>;
  getEventBounds: () => LngLatBoundsLike;

  epochCount: number;
  setEpochCount: React.Dispatch<React.SetStateAction<number>>;

  epochDuration: number;
  setEpochDuration: React.Dispatch<React.SetStateAction<number>>;

  epochStartTime: number;
  setEpochStartTime: React.Dispatch<React.SetStateAction<number>>;

  interestPoints: InterestPoint[];
  setInterestPoints: React.Dispatch<React.SetStateAction<InterestPoint[]>>;

  revealedFroglins: Froglin[];
  revealFroglins: (froglins: Froglin[]) => void;

  capturedFroglins: Froglin[];
  captureFroglins: (froglinIds: Froglin["id"][]) => void;
};

const socket = new WebSocket("wss://localhost:3002");

socket.addEventListener("open", () => {
  console.log("WebSocket connection established");
});

socket.addEventListener("message", (event) => {
  console.log("Received " + event.data);

  if (event.data === "reload") window.location.reload();
});

socket.addEventListener("close", () => {
  console.log("WebSocket connection closed");
});

socket.addEventListener("error", (error) => {
  console.error("WebSocket error:", error);
});

function createState(): GameEventStateTemporar {
  // console.log("GameEventState createState");

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

  async function fetchData() {
    try {
      const response = await fetch("https://localhost:3002/game");

      const event: ServerGameEventState = await response.json();

      setBounds(event.bounds);
      setEpochCount(event.epochCount);
      setEpochDuration(event.epochDuration);
      setEpochStartTime(event.epochStartTime);

      for (let i = 0; i !== event.interestPoints.length; ++i) {
        event.interestPoints[i].visible = true;
      }
      setInterestPoints(event.interestPoints);
      //
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(
    () => {
      function handleServerEpochUpdate(event: MessageEvent<any>) {
        if (event.data === "newEpoch") fetchData();
      }

      socket.addEventListener("message", handleServerEpochUpdate);

      fetchData();

      return () => {
        socket.removeEventListener("message", handleServerEpochUpdate);
      };
    }, //
    [],
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

export const { Provider: RealEventStateProvider, useProvider: useRealEventState } =
  StoreFactory<GameEventStateTemporar>(createState);
