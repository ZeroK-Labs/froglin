import { InterestPoint, MapCoordinates } from "common/types";

type GameEventBase = {
  location: MapCoordinates;
  bounds: [number, number][][];
  epochCount: number;
  epochDuration: number;
  epochStartTime: number;
  interestPoints: InterestPoint[];
};

export default GameEventBase;
