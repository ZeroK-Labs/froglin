import MapCoordinates from "../../common/types/MapCoordinates";

type LocationInfo = {
  disabled: boolean;
  coordinates: MapCoordinates;
  lost: boolean;
  metersTravelled: number;
};

export default LocationInfo;
