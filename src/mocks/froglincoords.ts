import MapCoordinates from "types/MapCoordinates";

function generateRandomCoordinates(
  coords: MapCoordinates,
  n: number,
  max: number,
  min: number,
): MapCoordinates[] {
  const newCoords: MapCoordinates[] = [];

  for (let i = 0; i !== n; ++i) {
    const randomLat = Math.random() * (max - min) + min;
    const randomLong = Math.random() * (max - min) + min;

    const latAdjustment = Math.random() < 0.5 ? -randomLat : randomLat;
    const longAdjustment = Math.random() < 0.5 ? -randomLong : randomLong;

    newCoords.push({
      latitude: coords.latitude + latAdjustment,
      longitude: coords.longitude + longAdjustment,
    });
  }

  return newCoords;
}

export function generateSpreadOutFroglinsCoordinates(
  coords: MapCoordinates,
  count: number,
) {
  return generateRandomCoordinates(coords, count, 0.004, 0.0001);
}

export function generateCloseFroglinsCoordinates(
  coords: MapCoordinates,
  count: number,
) {
  return generateRandomCoordinates(coords, count, 0.0005, 0.0001);
}
