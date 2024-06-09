import { Position } from "geojson";
import { LngLatBoundsLike } from "mapbox-gl";

import { Froglin, MapCoordinates } from "types";

type GameEvent = {
  location: MapCoordinates;
  bounds: Position[][];
  epochCount: number;
  epochDuration: number;
  epochStartTime: number;
  dormantFroglins: MapCoordinates[];
  revealedFroglins: Froglin[];
  initialize: (location: MapCoordinates) => void;
  createFroglins: () => void;
  getBounds: () => LngLatBoundsLike;
};

export default GameEvent;
