import type { MapCoordinates } from "common/types";
import { AngleToRadian } from "./math";
import { EVENT } from "frontend/settings";

// radius of Earth in kilometers; 3956 for miles
export const METERS_IN_EARTH_RADIUS = 6_371_008.8;
export const METERS_PER_DEGREE_LATITUDE = 111_139;
export const RADIANS_PER_METER_LATITUDE = 0.000008983;

// for fast(er) math
const INVERSE_METERS_PER_DEGREE_LATITUDE = 1 / METERS_PER_DEGREE_LATITUDE;

export function getDistance(lng1: number, lng2: number, lat1: number, lat2: number) {
  const n = lat1 * AngleToRadian;
  const r = lat2 * AngleToRadian;
  const i =
    Math.sin(r) * Math.sin(n) +
    Math.cos(r) * Math.cos(n) * Math.cos((lng2 - lng1) * AngleToRadian);

  return METERS_IN_EARTH_RADIUS * Math.acos(Math.min(i, 1));
}

export function inRange(
  center: MapCoordinates,
  location: MapCoordinates,
  distance: number,
): boolean {
  return (
    getDistance(
      center.longitude,
      location.longitude,
      center.latitude,
      location.latitude,
    ) <= distance
  );
}

function sign(p1: MapCoordinates, p2: MapCoordinates, p3: MapCoordinates) {
  return (
    (p1.longitude - p3.longitude) * (p2.latitude - p3.latitude) -
    (p2.longitude - p3.longitude) * (p1.latitude - p3.latitude)
  );
}

export function inTriangle(
  location: MapCoordinates,
  vertices: [MapCoordinates, MapCoordinates, MapCoordinates],
) {
  const v1 = vertices[0];
  const v2 = vertices[1];
  const v3 = vertices[2];

  const d1 = sign(location, v1, v2);
  const d2 = sign(location, v2, v3);
  const d3 = sign(location, v3, v1);

  if (d1 === d2 && d2 === d3) return false;

  const positive = d1 > 0 && d2 > 0 && d3 > 0;
  const negative = d1 < 0 && d2 < 0 && d3 < 0;

  return positive || negative;
}

const latitudeDelta = (EVENT.BOUNDS_SIDE_LENGTH / METERS_PER_DEGREE_LATITUDE) * 0.5;

export function getBoundsForCoordinate(location: MapCoordinates): [number, number][][] {
  const { latitude, longitude } = location;

  // adjust based on latitude
  const longitudeDelta = latitudeDelta / Math.cos(latitude * AngleToRadian);

  const box = {
    NW: {
      longitude: longitude - longitudeDelta,
      latitude: latitude + latitudeDelta,
    },
    NE: {
      longitude: longitude + longitudeDelta,
      latitude: latitude + latitudeDelta,
    },
    SE: {
      latitude: latitude - latitudeDelta,
      longitude: longitude + longitudeDelta,
    },
    SW: {
      longitude: longitude - longitudeDelta,
      latitude: latitude - latitudeDelta,
    },
  };

  return [
    [
      [box.NW.longitude, box.NW.latitude],
      [box.NE.longitude, box.NE.latitude],
      [box.SE.longitude, box.SE.latitude],
      [box.SW.longitude, box.SW.latitude],
      [box.NW.longitude, box.NW.latitude], // close polygon by repeating first vertex
    ],
  ];
}

export function getInterestPoints(
  center: MapCoordinates,
  count: number,
  meters_min: number,
  meters_max: number,
): MapCoordinates[] {
  const newCoords: MapCoordinates[] = [];

  const min = meters_min * INVERSE_METERS_PER_DEGREE_LATITUDE;
  const max = meters_max * INVERSE_METERS_PER_DEGREE_LATITUDE;

  const diff = max - min;
  for (let i = 0; i !== count; ++i) {
    const randomLat = Math.random() * diff + min;
    const randomLong = Math.random() * diff + min;

    const latOffset = Math.random() < 0.5 ? -randomLat : randomLat;
    const lonOffset = Math.random() < 0.5 ? -randomLong : randomLong;

    // adjust longitude based on the cosine of the latitude
    const adjustedLongitude = lonOffset / Math.cos(center.latitude * AngleToRadian);

    newCoords.push({
      latitude: center.latitude + latOffset,
      longitude: center.longitude + adjustedLongitude,
    });
  }

  return newCoords;
}
