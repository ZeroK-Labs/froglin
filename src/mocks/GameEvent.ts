import { GameEvent, MapCoordinates } from "types";

import {
  generateCoordinateBounds,
  generateFarCoordinates,
  generateImmediateCoordinates,
  generateNearCoordinates,
} from "mocks";

export function createGameEvent(): GameEvent {
  const gameEvent: GameEvent = {
    location: { latitude: 0, longitude: 0 },
    bounds: [],
    epochCount: 21,
    epochDuration: 4_000,
    epochStartTime: 0,
    dormantFroglins: [],
    initialize: (location: MapCoordinates) => {
      gameEvent.location = location;
      gameEvent.bounds = generateCoordinateBounds(gameEvent.location);
      gameEvent.dormantFroglins = new Array<MapCoordinates>(100).fill({
        latitude: 0,
        longitude: 0,
      });
      gameEvent.createFroglins();
    },
    createFroglins: () => {
      const nearCount = Math.floor(Math.random() * 12) + 3;
      const immediateCount = 3;
      gameEvent.dormantFroglins = [
        ...generateFarCoordinates(
          gameEvent.location,
          gameEvent.dormantFroglins.length - nearCount - immediateCount,
        ),
        ...generateNearCoordinates(gameEvent.location, nearCount),
        ...generateImmediateCoordinates(gameEvent.location, immediateCount),
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
