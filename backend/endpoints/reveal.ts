import { Request, Response } from "express";
import { CLIENT_SESSION_DATA } from "../sockets";

export function revealFroglins(req: Request, res: Response) {
  res.setHeader("content-type", "text/json");

  // pre-emptively set status to error
  res.statusCode = 400;

  const { playerId, hiddenInterestPointIds } = req.body;

  if (!playerId) {
    res.json("Missing playerId");
    return;
  }

  if (!hiddenInterestPointIds) {
    res.json("Missing hiddenInterestPointIds");
    return;
  }

  const gameEvent = CLIENT_SESSION_DATA[playerId].GameEvent;

  if (!gameEvent) {
    res.json("Missing game event");
    return;
  }

  gameEvent.revealInterestPoints(hiddenInterestPointIds);

  res.statusCode = 200;
  res.json("Reveal complete");
}
