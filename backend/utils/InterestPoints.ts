import type { MapCoordinates } from "common/types";
import { ClientSessionData } from "backend/types";
import { EVENT } from "frontend/settings";
import { getInterestPoints } from "common/utils/map";

function getFarInterestPoints(coords: MapCoordinates, count: number) {
  return getInterestPoints(coords, count, EVENT.FAR_RANGE.FROM, EVENT.FAR_RANGE.TO);
}

function getNearInterestPoints(coords: MapCoordinates, count: number) {
  return getInterestPoints(coords, count, EVENT.NEAR_RANGE.FROM, EVENT.NEAR_RANGE.TO);
}

function getCloseInterestPoints(coords: MapCoordinates, count: number) {
  return getInterestPoints(coords, count, EVENT.CLOSE_RANGE.FROM, EVENT.CLOSE_RANGE.TO);
}

export function generateInterestPoints(session: ClientSessionData, totalCount: number) {
  // generate new coordinates for the interest points
  const nearCount = Math.min(Math.floor(totalCount * 0.15) ?? 0, 15);
  const closeCount = Math.min(Math.floor(totalCount * 0.15) ?? 1, 5);

  const coordinates: MapCoordinates[] = [
    ...getFarInterestPoints(session.location, totalCount - nearCount - closeCount),
    ...getNearInterestPoints(session.location, nearCount),
    ...getCloseInterestPoints(session.location, closeCount),
  ];

  // set new coordinates
  for (let i = 0; i !== totalCount; ++i) {
    session.interestPoints[i].coordinates = coordinates[i];
  }
}
