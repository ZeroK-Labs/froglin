import { Request, Response } from "express";

import { CLIENT_SESSION_DATA } from "backend/start";

export function getEventBounds(req: Request, res: Response) {
  res.setHeader("content-type", "text/json");

  // pre-emptively set status to error
  res.statusCode = 400;

  const sessionId = req.query.sessionId as string;
  if (!sessionId) {
    res.json("Missing sessionId");
    return;
  }

  const session = CLIENT_SESSION_DATA[sessionId];
  if (!session || !session.Socket) {
    res.json(`Missing socket connection for player ${sessionId}`);
    return;
  }

  res.statusCode = 200;
  res.json(session.bounds);
}
