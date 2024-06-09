import { MapCoordinates } from "types";
type Froglin = {
  coordinates: MapCoordinates;
  type: number;
  revealed: boolean;
  captured: boolean;
};

export default Froglin;
