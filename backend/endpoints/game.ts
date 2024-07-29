import { Request, Response } from "express";

import { createGameEvent } from "../stores/GameEvent";
import { CLIENT_SESSION_DATA } from "../sockets";

export function getGame(req: Request, res: Response) {
  res.setHeader("content-type", "text/json");

  // pre-emptively set status to error
  res.statusCode = 400;

  const playerId = req.query.playerId as string;
  if (!playerId) {
    res.json("Missing playerId");
    return;
  }

  if (!CLIENT_SESSION_DATA[playerId] || !CLIENT_SESSION_DATA[playerId].Socket) {
    res.json(`Missing socket connection for player ${playerId}`);
    return;
  }

  let gameEvent = CLIENT_SESSION_DATA[playerId].GameEvent;
  if (gameEvent) {
    res.statusCode = 200;
    res.json(gameEvent);
    return;
  }

  const longitude = Number(req.query.longitude);
  if (!(longitude && isFinite(longitude))) {
    res.json("Missing or incorrect longitude");
    return;
  }
  const latitude = Number(req.query.latitude);
  if (!(latitude && isFinite(latitude))) {
    res.json("Missing or incorrect latitude");
    return;
  }

  gameEvent = createGameEvent(playerId, {
    longitude,
    latitude,
  });

  if (!gameEvent) {
    res.json("Failed to create game event");
    return;
  }

  gameEvent.start();

  CLIENT_SESSION_DATA[playerId].GameEvent = gameEvent;

  res.statusCode = 200;
  res.json(gameEvent);
}
