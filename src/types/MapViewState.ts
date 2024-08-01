import { MAP_VIEWS } from "enums";

type MapViewState = {
  mapView: MAP_VIEWS;
  setMapView: React.Dispatch<React.SetStateAction<MAP_VIEWS>>;
};

export default MapViewState;
