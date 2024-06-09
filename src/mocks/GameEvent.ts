import { GameEvent, MapCoordinates } from "types";

import {
  generateCloseFroglinsCoordinates,
  generateEvenCloserFroglinsCoordinates,
  generateEventBounds,
  generateSpreadOutFroglinsCoordinates,
} from "mocks";

export function createGameEvent(): GameEvent {
  const gameEvent: GameEvent = {
    location: { latitude: 0, longitude: 0 },
    bounds: [],
    epochCount: 10,
    epochDuration: 6_000,
    epochStartTime: 0,
    dormantFroglins: new Array<MapCoordinates>(100).fill({
      latitude: 0,
      longitude: 0,
    }),
    revealedFroglins: [],
    initialize: (location: MapCoordinates) => {
      gameEvent.location = location;
      gameEvent.bounds = generateEventBounds(gameEvent.location);
      gameEvent.dormantFroglins = new Array<MapCoordinates>(100).fill({
        latitude: 0,
        longitude: 0,
      });
      gameEvent.createFroglins();
    },
    createFroglins: () => {
      const nearCount = Math.floor(Math.random() * 12) + 3;
      const veryNearCount = 5;
      gameEvent.dormantFroglins = [
        ...generateSpreadOutFroglinsCoordinates(
          gameEvent.location,
          gameEvent.dormantFroglins.length - nearCount - veryNearCount,
        ),
        ...generateCloseFroglinsCoordinates(gameEvent.location, nearCount),
        ...generateEvenCloserFroglinsCoordinates(
          gameEvent.location,
          veryNearCount,
        ),
      ];
    },
    getBounds: () => {
      const root = gameEvent.bounds[0];
      if (!root) return [0, 0];
      return [root[0][0], root[0][1], root[2][0], root[2][1]];
    },
  };

  return gameEvent;
}
