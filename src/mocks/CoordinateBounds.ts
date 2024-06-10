import { Position } from "geojson";

import { AngleToRadian } from "utils/math";
import { METERS_PER_LATITUDE_DEGREE } from "utils/map";
import { MapCoordinates } from "types";

const size = 500; // meters
const latitudeDelta = size / METERS_PER_LATITUDE_DEGREE;

export function generateCoordinateBounds(
  location: MapCoordinates,
): Position[][] {
  const { latitude, longitude } = location;

  // adjust based on latitude
  const longitudeDelta = latitudeDelta / Math.cos(latitude * AngleToRadian); // ~500 m

  const box = {
    northwest: {
      latitude: latitude + latitudeDelta,
      longitude: longitude - longitudeDelta,
    },
    northeast: {
      latitude: latitude + latitudeDelta,
      longitude: longitude + longitudeDelta,
    },
    southeast: {
      latitude: latitude - latitudeDelta,
      longitude: longitude + longitudeDelta,
    },
    southwest: {
      latitude: latitude - latitudeDelta,
      longitude: longitude - longitudeDelta,
    },
  };

  return [
    [
      [box.northwest.longitude, box.northwest.latitude],
      [box.northeast.longitude, box.northeast.latitude],
      [box.southeast.longitude, box.southeast.latitude],
      [box.southwest.longitude, box.southwest.latitude],
    ],
  ];
}
