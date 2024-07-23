import { MapCoordinates } from "../types";

type InterestPoint = {
  id: string;
  coordinates: MapCoordinates;
  visible?: boolean;
};

export default InterestPoint;
