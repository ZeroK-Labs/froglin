import MapCoordinates from "./MapCoordinates";

type LocationInfo = {
  disabled: boolean;
  coordinates: MapCoordinates;
  lost: boolean;
  metersTravelled: number;
};

export default LocationInfo;
