import { LngLatBoundsLike } from "mapbox-gl";

import type { Froglin } from "frontend/types";
import type { InterestPoint } from ".";

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
