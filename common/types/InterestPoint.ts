import { MapCoordinates } from "./";

type InterestPoint = {
  id: string;
  coordinates: MapCoordinates;
  visible?: boolean;
};

export default InterestPoint;
