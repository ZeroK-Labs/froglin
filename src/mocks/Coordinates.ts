import MapCoordinates from "types/MapCoordinates";
import { AngleToRadian } from "utils/math";
import { METERS_PER_LATITUDE_DEGREE } from "utils/map";

function generateCoordinates(
  center: MapCoordinates,
  count: number,
  meters_max: number,
  meters_min: number,
): MapCoordinates[] {
  const newCoords: MapCoordinates[] = [];

  const min = meters_min / METERS_PER_LATITUDE_DEGREE;
  const max = meters_max / METERS_PER_LATITUDE_DEGREE;

  const diff = max - min;
  for (let i = 0; i !== count; ++i) {
    const randomLat = Math.random() * diff + min;
    const randomLong = Math.random() * diff + min;

    const latOffset = Math.random() < 0.5 ? -randomLat : randomLat;
    const lonOffset = Math.random() < 0.5 ? -randomLong : randomLong;

    // adjust longitude based on the cosine of the latitude
    const adjustedLongitude =
      lonOffset / Math.cos(center.latitude * AngleToRadian);

    newCoords.push({
      latitude: center.latitude + latOffset,
      longitude: center.longitude + adjustedLongitude,
    });
  }

  return newCoords;
}

export function generateFarCoordinates(coords: MapCoordinates, count: number) {
  return generateCoordinates(coords, count, 500, 50);
}

export function generateNearCoordinates(coords: MapCoordinates, count: number) {
  return generateCoordinates(coords, count, 50, 15);
}
export function generateImmediateCoordinates(
  coords: MapCoordinates,
  count: number,
) {
  return generateCoordinates(coords, count, 15, 2);
}
