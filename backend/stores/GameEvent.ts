import { EVENT } from "../../src/settings";
import { MapCoordinates, TimeoutId } from "../../common/types";
import { getInterestPoints, getBoundsForCoordinate } from "../../common/utils/map";
import { broadcastMessage } from "../sockets";
import { ServerGameEvent } from "../types";

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
    id: "_" + i, // frontend React needs a string id
    coordinates: { longitude: 0, latitude: 0 },
  }));
}

export function createGameEvent(center: MapCoordinates): ServerGameEvent {
  let epochIntervalId: TimeoutId;

  const event: ServerGameEvent = {
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

      event.epochStartTime = Date.now();

      const totalCount = event.interestPoints.length;
      if (totalCount === 0) {
        console.error("No interest points to update");
        broadcastMessage("newEpoch");
        return;
      }

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
      console.log("New epoch", event.epochCount);
      broadcastMessage("newEpoch");
    },

    revealInterestPoints: function (interestPointIds: string[]) {
      const filteredInterestPoints = event.interestPoints.filter(
        (interestPoint) => !interestPointIds.includes(interestPoint.id),
      );

      event.interestPoints = filteredInterestPoints;
    },
  };

  return event;
}
