import { MapCoordinates, InterestPoint } from "../../common/types";

type ServerGameEvent = {
  location: MapCoordinates;
  bounds: GeoJSON.Position[][];
  epochCount: number;
  epochDuration: number;
  epochStartTime: number;
  interestPoints: InterestPoint[];

  start: () => void;
  advanceEpoch: () => void;
  revealInterestPoints: (interestPointIds: InterestPoint["id"][]) => void;
};

export default ServerGameEvent;
