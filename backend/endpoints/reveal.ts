import { Request, Response } from "express";
import { CLIENT_SESSION_DATA } from "backend/utils/sockets";

export function revealFroglins(req: Request, res: Response) {
  res.setHeader("content-type", "text/json");

  // pre-emptively set status to error
  res.statusCode = 400;

  const { sessionId, hiddenInterestPointIds } = req.body;

  if (!sessionId) {
    res.json("Missing sessionId");
    return;
  }

  if (!hiddenInterestPointIds) {
    res.json("Missing hiddenInterestPointIds");
    return;
  }

  const gameEvent = CLIENT_SESSION_DATA[sessionId].GameEvent;

  if (!gameEvent) {
    res.json("Missing game event");
    return;
  }

  gameEvent.revealInterestPoints(hiddenInterestPointIds);

  res.statusCode = 200;
  res.json("Reveal complete");
}
