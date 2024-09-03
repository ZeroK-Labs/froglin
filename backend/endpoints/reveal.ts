import { Request, Response } from "express";

import { CLIENT_SESSION_DATA } from "backend/start";

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

  const session = CLIENT_SESSION_DATA[sessionId];

  if (!session) {
    res.json(`Missing player session ${session}`);
    return;
  }

  const filteredInterestPoints = session.interestPoints.filter(
    (interestPoint) => !hiddenInterestPointIds.includes(interestPoint.id),
  );

  session.interestPoints = filteredInterestPoints;

  res.statusCode = 200;
  res.json("Reveal complete");
}
