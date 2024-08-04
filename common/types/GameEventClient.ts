import { LngLatBoundsLike } from "mapbox-gl";

import { Froglin } from "frontend/types";
import { InterestPoint } from ".";

type GameEventClient = {
  bounds: [number, number][][];
  setBounds: React.Dispatch<React.SetStateAction<[number, number][][]>>;
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

export default GameEventClient;
