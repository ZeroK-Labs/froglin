import { EVENT } from "../src/settings";
import { InterestPoint, MapCoordinates, TimeoutId } from "types";
import { getInterestPoints, getBoundsForCoordinate } from "../src/utils/map";
import { broadcastMessage } from "./sockets";

export type ServerGameEventState = {
  location: MapCoordinates;
  bounds: GeoJSON.Position[][];
  epochCount: number;
  epochDuration: number;
  epochStartTime: number;
  interestPoints: InterestPoint[];

  start: () => void;
  advanceEpoch: () => void;
  revealInterestPoints: (interestPointIds: InterestPoint["id"][]) => void;
};

function getFarInterestPoints(coords: MapCoordinates, count: number) {
  return getInterestPoints(coords, count, EVENT.FAR_RANGE.FROM, EVENT.FAR_RANGE.TO);
}

function getNearInterestPoints(coords: MapCoordinates, count: number) {
  return getInterestPoints(coords, count, EVENT.NEAR_RANGE.FROM, EVENT.NEAR_RANGE.TO);
}

function getCloseInterestPoints(coords: MapCoordinates, count: number) {
  return getInterestPoints(coords, count, EVENT.CLOSE_RANGE.FROM, EVENT.CLOSE_RANGE.TO);
}

function getInitialInterestPoints() {
  return Array.from({ length: EVENT.MARKER_COUNT }, (_, i) => ({
    id: "_" + i, // used by React
    coordinates: { longitude: 0, latitude: 0 },
  }));
}

export function createGameEvent(center: MapCoordinates): ServerGameEventState {
  let epochIntervalId: TimeoutId;

  const event: ServerGameEventState = {
    location: center,
    bounds: getBoundsForCoordinate(center),
    epochCount: 0,
    epochDuration: EVENT.EPOCH_DURATION,
    epochStartTime: 0,
    interestPoints: getInitialInterestPoints(),

    start: function () {
      clearInterval(epochIntervalId);
      epochIntervalId = setInterval(event.advanceEpoch, event.epochDuration);

      event.epochCount = EVENT.EPOCH_COUNT + 1;
      event.interestPoints = getInitialInterestPoints();

      event.advanceEpoch();
    },

    advanceEpoch: function () {
      event.epochCount -= 1;
      if (event.epochCount === 0) {
        event.start();
        return;
      }

      broadcastMessage("newEpoch");

      event.epochStartTime = Date.now();

      const totalCount = event.interestPoints.length;
      if (totalCount === 0) return;

      // generate new coordinates for the interest points
      const nearCount = Math.floor(Math.random() * 12) + 3;
      const closeCount = 5;

      const coordinates: MapCoordinates[] = [
        ...getFarInterestPoints(event.location, totalCount - nearCount - closeCount),
        ...getNearInterestPoints(event.location, nearCount),
        ...getCloseInterestPoints(event.location, closeCount),
      ];

      // set new coordinates
      for (let i = 0; i !== totalCount; ++i) {
        event.interestPoints[i].coordinates = coordinates[i];
      }
    },

    revealInterestPoints: function (interestPointIds: InterestPoint["id"][]) {
      for (let i = 0; i !== event.interestPoints.length; ++i) {
        const interestPointId = event.interestPoints[i].id;

        for (let j = 0; j !== interestPointIds.length; ++j) {
          if (interestPointId !== interestPointIds[j]) continue;

          interestPointIds.splice(j, 1);
          event.interestPoints.splice(i, 1);

          break;
        }
      }
    },
  };

  return event;
}
