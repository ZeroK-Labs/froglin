import { LngLatBoundsLike } from "mapbox-gl";

import { Froglin, InterestPoint, MapCoordinates } from "types";

type GameEventState = {
  location: MapCoordinates;
  setLocation: React.Dispatch<React.SetStateAction<MapCoordinates>>;

  bounds: GeoJSON.Position[][];
  setBounds: React.Dispatch<React.SetStateAction<GeoJSON.Position[][]>>;
  getEventBounds: () => LngLatBoundsLike;

  epochCount: number;
  setEpochCount: React.Dispatch<React.SetStateAction<number>>;

  epochDuration: number;
  setEpochDuration: React.Dispatch<React.SetStateAction<number>>;

  epochStartTime: number;
  setEpochStartTime: React.Dispatch<React.SetStateAction<number>>;

  interestPoints: InterestPoint[];
  setInterestPoints: React.Dispatch<React.SetStateAction<InterestPoint[]>>;

  revealedFroglins: Froglin[];
  revealFroglins: (froglins: Froglin[]) => void;

  capturedFroglins: Froglin[];
  captureFroglins: (froglinIds: Froglin["id"][]) => void;
};

export default GameEventState;
