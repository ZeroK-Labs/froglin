import { useEffect, useState } from "react";

import { Froglin, GameEventState, InterestPoint } from "types";
import { LngLatBoundsLike } from "mapbox-gl";
import { StoreFactory } from "stores";
import { ServerGameEventState } from "../../backend/GameEventState";
import { CLIENT_SOCKET } from "utils/sockets";

function createState(): GameEventState {
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

      CLIENT_SOCKET.addEventListener("message", handleServerEpochUpdate);

      fetchData();

      return () => {
        CLIENT_SOCKET.removeEventListener("message", handleServerEpochUpdate);
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
  StoreFactory<GameEventState>(createState);
