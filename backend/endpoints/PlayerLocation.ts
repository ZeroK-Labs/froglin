import { Request, Response } from "express";

import { CLIENT_SESSION_DATA } from "backend/start";
import { getBoundsForCoordinate } from "common/utils/map";
import { BACKEND_WALLET } from "backend/utils/aztec";
import { generateInterestPoints } from "backend/utils/InterestPoints";
import { nullifyMapCoordinates } from "frontend/classes/MapCoordinates";

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

  const longitude = Number(req.body.longitude);
  const latitude = Number(req.body.latitude);

  if (isNaN(latitude) && isNaN(longitude)) {
    const session = CLIENT_SESSION_DATA[sessionId];

    nullifyMapCoordinates(session.location);
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

  const session = CLIENT_SESSION_DATA[sessionId];

  session.location = location;
  session.bounds = getBoundsForCoordinate(location);

  const keys = Object.keys(CLIENT_SESSION_DATA);
  const count =
    keys.length === 1
      ? Number(
          await BACKEND_WALLET.contracts.gateway.methods
            .view_froglin_count()
            .simulate(),
        )
      : CLIENT_SESSION_DATA[keys[0]].interestPoints.length;
  session.interestPoints = Array.from({ length: count }, (_, i) => ({
    id: "_" + i, // frontend React needs a string id
    coordinates: { longitude: 0, latitude: 0 },
  }));
  generateInterestPoints(session, count);

  res.statusCode = 200;
  res.json("Location updated");
}
