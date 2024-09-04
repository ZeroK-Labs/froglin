import type { Froglin } from "frontend/types";
import type { InterestPoint } from ".";

type GameEventClient = {
  bounds: [number, number][][];
  getEventBounds: () => [[number, number], [number, number]];

  epochCount: number;
  epochDuration: number;
  epochStartTime: number;
  interestPoints: InterestPoint[];

  revealedFroglins: Froglin[];
  revealFroglins: (radius: number) => void;

  capturing: boolean;
  capturedFroglins: Froglin[];
  captureFroglins: (froglinIds: Froglin["id"][]) => void;
};

export default GameEventClient;
