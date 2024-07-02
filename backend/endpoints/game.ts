import { Request, Response } from "express";

import { createGameEvent } from "../GameEventState";

const event = createGameEvent({
  latitude: 51.440086,
  longitude: 5.469377,
});

event.start();

export function getGame(req: Request, res: Response) {
  res.setHeader("content-type", "text/json");
  res.json(event);
}
