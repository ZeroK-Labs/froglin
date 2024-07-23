import { Request, Response } from "express";
import { gameEventsByUser } from "./game";

export function revealFroglins(req: Request, res: Response) {
  const { username, hiddenInterestPointsIds } = req.body;
  const gameEvent = gameEventsByUser.get(username);

  if (!gameEvent) {
    throw new Error("Game event not found");
  }
  gameEvent.revealInterestPoints(hiddenInterestPointsIds);

  res.setHeader("content-type", "text/json");
  res.json("Reveal complete");
}
