import { Request, Response } from "express";

import { createGameEvent } from "../stores/GameEvent";
import { ServerGameEvent } from "../types";

export const gameEventsByUser: Map<string, ServerGameEvent> = new Map();

export function getGame(req: Request, res: Response) {
  const username = req.query.username as string;
  const latitude = Number(req.query.latitude);
  const longitude = Number(req.query.longitude);

  if (!username || !latitude || !longitude) {
    throw new Error("Missing parameters");
  }

  let userEvent = gameEventsByUser.get(username);
  if (!userEvent) {
    userEvent = createGameEvent({
      latitude,
      longitude,
    });
    userEvent.start();
  }

  gameEventsByUser.set(username, userEvent);

  res.setHeader("content-type", "text/json");
  res.json(userEvent);
}
