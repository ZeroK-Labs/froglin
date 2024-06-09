import * as THREE from "three";
import { MercatorCoordinate } from "mapbox-gl";

import MapCoordinates from "types/MapCoordinates";
import { AngleToRadian, HalfPI } from "utils/math";

// Radius of earth in kilometers; 3956 for miles
const EARTH_RADIUS_KM = 6371;

export function getDistance(
  lat1: number,
  lat2: number,
  lon1: number,
  lon2: number,
) {
  lon1 *= AngleToRadian;
  lon2 *= AngleToRadian;
  lat1 *= AngleToRadian;
  lat2 *= AngleToRadian;

  // Haversine formula
  let dlon = lon2 - lon1;
  let dlat = lat2 - lat1;
  let a =
    Math.pow(Math.sin(dlat / 2), 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dlon / 2), 2);

  let c = 2 * Math.asin(Math.sqrt(a));

  // calculate the result in meters
  return c * EARTH_RADIUS_KM * 1000;
}

export function inRange(
  coordinates: MapCoordinates,
  location: MapCoordinates,
  distance: number,
) {
  return (
    getDistance(
      coordinates.latitude,
      location.latitude,
      coordinates.longitude,
      location.longitude,
    ) <= distance
  );
}

const quaternion = new THREE.Quaternion();
const euler = new THREE.Euler();
const position = new THREE.Vector3();
const scaleVector = new THREE.Vector3();

export function coordsToMatrix(
  {
    longitude,
    latitude,
    altitude = 0,
    rotation = [-HalfPI, 0, 0],
    scale = [1, 1, 1],
  }: MapCoordinates & {
    rotation?: [number, number, number];
    scale?: [number, number, number];
  },
  matrix4 = new THREE.Matrix4(), // specify existing instance or allocate
): THREE.Matrix4 {
  const center = MercatorCoordinate.fromLngLat([longitude, latitude], altitude);
  const scaleUnit = center.meterInMercatorCoordinateUnits();

  position.set(center.x, center.y, center.z || 0);
  scaleVector.set(
    scaleUnit * scale[0],
    -scaleUnit * scale[1],
    scaleUnit * scale[2],
  );
  quaternion.setFromEuler(euler.set(rotation[0], rotation[1], rotation[2]));

  return matrix4.compose(position, quaternion, scaleVector);
}
