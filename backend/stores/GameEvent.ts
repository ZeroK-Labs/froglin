import { CLIENT_SESSION_DATA } from "backend/start";
import { EVENT } from "frontend/settings";
import { GameEventServer, MapCoordinates } from "common/types";
import { getInterestPoints, getBoundsForCoordinate } from "common/utils/map";

function getFarInterestPoints(coords: MapCoordinates, count: number) {
  return getInterestPoints(coords, count, EVENT.FAR_RANGE.FROM, EVENT.FAR_RANGE.TO);
}

function getNearInterestPoints(coords: MapCoordinates, count: number) {
  return getInterestPoints(coords, count, EVENT.NEAR_RANGE.FROM, EVENT.NEAR_RANGE.TO);
}

function getCloseInterestPoints(coords: MapCoordinates, count: number) {
  return getInterestPoints(coords, count, EVENT.CLOSE_RANGE.FROM, EVENT.CLOSE_RANGE.TO);
}

function notifyNewEpoch(sessionId: string) {
  const socket = CLIENT_SESSION_DATA[sessionId].Socket;
  if (socket && socket.readyState === WebSocket.OPEN) socket.send("newEpoch");
}

function sessionAlive(sessionId: string, contextInfo: string) {
  if (
    CLIENT_SESSION_DATA[sessionId] &&
    CLIENT_SESSION_DATA[sessionId].Socket &&
    CLIENT_SESSION_DATA[sessionId].Socket.readyState === WebSocket.OPEN
  ) {
    return true;
  }

  console.error(
    `Failed to ${contextInfo} game event: client socket connection required`,
  );
  return false;
}

export function createGameEvent(
  sessionId: string,
  location: MapCoordinates,
): GameEventServer | null {
  if (!sessionAlive(sessionId, "create")) return null;

  let epochIntervalId: Timer;
  const event: GameEventServer = {
    location,
    bounds: getBoundsForCoordinate(location),
    epochCount: 0,
    epochDuration: EVENT.EPOCH_DURATION,
    epochStartTime: 0,
    interestPoints: [],

    start: function () {
      if (event.epochCount !== 0 && event.epochStartTime !== 0) {
        console.error("Failed to start event: already in progress");

        return;
      }

      if (!sessionAlive(sessionId, "start")) {
        CLIENT_SESSION_DATA[sessionId].GameEvent = null;

        return;
      }

      console.log(sessionId, "newGame");

      event.epochCount = EVENT.EPOCH_COUNT;
      event.interestPoints = Array.from({ length: EVENT.MARKER_COUNT }, (_, i) => ({
        id: "_" + i, // frontend React needs a string id
        coordinates: { longitude: 0, latitude: 0 },
      }));

      event.advanceEpoch();
      epochIntervalId = setInterval(event.advanceEpoch, event.epochDuration);
    },

    stop: function () {
      clearInterval(epochIntervalId);
    },

    advanceEpoch: function () {
      if (event.epochCount === 0) {
        clearInterval(epochIntervalId);

        event.start();

        return;
      }

      console.log(sessionId, "epoch", event.epochCount);

      event.epochCount -= 1;
      event.epochStartTime = Date.now();

      const totalCount = event.interestPoints.length;
      if (totalCount === 0) {
        notifyNewEpoch(sessionId);

        return;
      }

      // generate new coordinates for the interest points
      const nearCount = Math.min(Math.floor(totalCount * 0.15) ?? 0, 15);
      const closeCount = Math.min(Math.floor(totalCount * 0.15) ?? 1, 5);

      const coordinates: MapCoordinates[] = [
        ...getFarInterestPoints(event.location, totalCount - nearCount - closeCount),
        ...getNearInterestPoints(event.location, nearCount),
        ...getCloseInterestPoints(event.location, closeCount),
      ];

      // set new coordinates
      for (let i = 0; i !== totalCount; ++i) {
        event.interestPoints[i].coordinates = coordinates[i];
      }

      notifyNewEpoch(sessionId);
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
