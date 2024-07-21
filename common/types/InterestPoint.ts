import { MapCoordinates } from "../types";

type InterestPoint = {
  id: number | string;
  coordinates: MapCoordinates;
  visible?: boolean;
};

export default InterestPoint;
