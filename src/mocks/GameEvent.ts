import { GameEvent } from "types";

export function createGameEvent(): GameEvent {
  const gameEvent: GameEvent = {
    location: { latitude: 0, longitude: 0 },
    bounds: [],
    epochs: 100,
    timePerEpoch: 30_000,
    startTime: 0,
    froglinCoordinates: {
      spreadOut: [],
      close: [],
    },
    getLngLatBoundsLike: () => {
      const root = gameEvent.bounds[0];
      if (!root) return [0, 0];
      return [root[0][0], root[0][1], root[2][0], root[2][1]];
    },
  };

  return gameEvent;
}
