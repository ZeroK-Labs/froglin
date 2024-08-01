import { InterestPoint, MapCoordinates } from "../../common/types";

type GameEventBase = {
  location: MapCoordinates;
  bounds: GeoJSON.Position[][];
  epochCount: number;
  epochDuration: number;
  epochStartTime: number;
  interestPoints: InterestPoint[];
};

export default GameEventBase;
