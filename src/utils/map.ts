import * as THREE from "three";
import { MercatorCoordinate } from "mapbox-gl";

import MapCoordinates from "types/MapCoordinates";
import { HalfPI } from "utils/math";

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
