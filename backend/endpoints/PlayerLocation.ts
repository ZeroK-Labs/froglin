import { Request, Response } from "express";

import { CLIENT_SESSION_DATA } from "backend/start";
import { getBoundsForCoordinate } from "common/utils/map";
import { BACKEND_WALLET } from "backend/utils/aztec";
import { generateInterestPoints } from "backend/utils/InterestPoints";

export async function setPlayerLocation(req: Request, res: Response) {
  res.setHeader("content-type", "text/json");

  // pre-emptively set status to error
  res.statusCode = 400;

  const sessionId = req.body.sessionId as string;
  if (!sessionId) {
    res.json("Missing sessionId");
    return;
  }

  if (!CLIENT_SESSION_DATA[sessionId] || !CLIENT_SESSION_DATA[sessionId].Socket) {
    res.json(`Missing socket connection for player ${sessionId}`);
    return;
  }

  const session = CLIENT_SESSION_DATA[sessionId];

  const longitude = Number(req.body.longitude);
  const latitude = Number(req.body.latitude);

  if (isNaN(latitude) && isNaN(longitude)) {
    session.location.longitude = NaN;
    session.location.latitude = NaN;

    session.bounds = [];
    session.interestPoints = [];

    res.statusCode = 200;
    res.json("Location reset");

    return;
  }

  if (!(latitude && isFinite(latitude))) {
    res.json("Missing or incorrect latitude");
    return;
  }
  if (!(longitude && isFinite(longitude))) {
    res.json("Missing or incorrect longitude");
    return;
  }

  const location = {
    longitude,
    latitude,
  };

  session.location = location;
  session.bounds = getBoundsForCoordinate(location);

  const count = Number(
    await BACKEND_WALLET.contracts.gateway.methods.view_froglin_count().simulate(),
  );

  session.interestPoints = Array.from({ length: count }, (_, i) => ({
    id: "_" + i, // frontend React needs a string id
    coordinates: { longitude: 0, latitude: 0 },
  }));
  generateInterestPoints(session, count);

  res.statusCode = 200;
  res.json("Location updated");
}
