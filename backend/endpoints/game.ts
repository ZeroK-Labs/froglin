import { Request, Response } from "express";

import { createGameEvent } from "../stores/GameEvent";
import { CLIENT_SESSION_DATA } from "../utils/sockets";

export function getGame(req: Request, res: Response) {
  res.setHeader("content-type", "text/json");

  // pre-emptively set status to error
  res.statusCode = 400;

  const sessionId = req.query.sessionId as string;
  if (!sessionId) {
    res.json("Missing sessionId");
    return;
  }

  if (!CLIENT_SESSION_DATA[sessionId] || !CLIENT_SESSION_DATA[sessionId].Socket) {
    res.json(`Missing socket connection for player ${sessionId}`);
    return;
  }

  let gameEvent = CLIENT_SESSION_DATA[sessionId].GameEvent;
  if (gameEvent) {
    const gameEventBase = {
      location: gameEvent.location,
      bounds: gameEvent.bounds,
      epochCount: gameEvent.epochCount,
      epochDuration: gameEvent.epochDuration,
      epochStartTime: gameEvent.epochStartTime,
      interestPoints: gameEvent.interestPoints,
    };
    res.statusCode = 200;
    res.json(gameEventBase);
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

  gameEvent = createGameEvent(sessionId, {
    longitude,
    latitude,
  });

  if (!gameEvent) {
    res.json("Failed to create game event");
    return;
  }

  gameEvent.start();

  CLIENT_SESSION_DATA[sessionId].GameEvent = gameEvent;

  res.statusCode = 200;
  res.json(gameEvent);
}
