import { Position } from "geojson";

import { MapCoordinates } from "types";
import { AngleToRadian } from "utils/math";

const offset = 222; // 1 degree of latitude is ~111 km
const latitudeDelta = 1 / offset; // ~500 m

export function generateEventBounds(location: MapCoordinates): Position[][] {
  const { latitude, longitude } = location;

  // 1 degree of longitude is ~111 km * at the equator *
  // adjust based on latitude
  const longitudeDelta = 1 / (offset * Math.cos(latitude * AngleToRadian)); // ~500 m

  const box = {
    northeast: {
      latitude: latitude + latitudeDelta,
      longitude: longitude + longitudeDelta,
    },
    northwest: {
      latitude: latitude + latitudeDelta,
      longitude: longitude - longitudeDelta,
    },
    southwest: {
      latitude: latitude - latitudeDelta,
      longitude: longitude - longitudeDelta,
    },
    southeast: {
      latitude: latitude - latitudeDelta,
      longitude: longitude + longitudeDelta,
    },
  };

  return [
    [
      [box.northeast.longitude, box.northeast.latitude],
      [box.northwest.longitude, box.northwest.latitude],
      [box.southwest.longitude, box.southwest.latitude],
      [box.southeast.longitude, box.southeast.latitude],
    ],
  ];
}
