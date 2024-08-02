import { MAP_VIEWS } from "src/enums";

type MapViewState = {
  mapView: MAP_VIEWS;
  setMapView: React.Dispatch<React.SetStateAction<MAP_VIEWS>>;
};

export default MapViewState;
