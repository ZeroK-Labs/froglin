import { LngLatBoundsLike } from "mapbox-gl";

import { Froglin } from "types";
import { InterestPoint } from "../../common/types";

type GameEvent = {
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

  revealedFroglins: Froglin[];
  revealFroglins: (radius: number) => void;

  capturedFroglins: Froglin[];
  captureFroglins: (froglinIds: Froglin["id"][]) => void;
};

export default GameEvent;
