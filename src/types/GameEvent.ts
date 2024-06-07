import { Position } from "geojson";

import { MapCoordinates } from "types";

type GameEvent = {
  location: MapCoordinates;
  bounds: Position[][];
  epochs: number;
  froglinCoordinates: {
    close: MapCoordinates[];
    spreadOut: MapCoordinates[];
  };
};

export default GameEvent;
