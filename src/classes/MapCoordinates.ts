import { MapCoordinates } from "../../common/types";

export function nullMapCoordinates(): MapCoordinates {
  return { longitude: NaN, latitude: 0 };
}

export function nullifyMapCoordinates(coordinates: MapCoordinates): MapCoordinates {
  coordinates.longitude = NaN;
  coordinates.latitude = 0;

  return coordinates;
}
