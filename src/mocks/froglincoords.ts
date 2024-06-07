import MapCoordinates from "types/MapCoordinates";

export function generateRandomCoordinates(
  baseCoord: MapCoordinates,
  n: number,
  max: number,
  min: number,
): MapCoordinates[] {
  const newCoords: MapCoordinates[] = [];

  for (let i = 0; i < n; i++) {
    const randomLat = Math.random() * (max - min) + min;
    const randomLong = Math.random() * (max - min) + min;

    // Randomly add or subtract the random values
    const latAdjustment = Math.random() < 0.5 ? -randomLat : randomLat;
    const longAdjustment = Math.random() < 0.5 ? -randomLong : randomLong;

    newCoords.push({
      latitude: baseCoord.latitude + latAdjustment,
      longitude: baseCoord.longitude + longAdjustment,
    });
  }

  return newCoords;
}
