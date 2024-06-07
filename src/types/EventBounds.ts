import MapCoordinates from "types/MapCoordinates";

type EventBounds = {
  northeast: MapCoordinates;
  northwest: MapCoordinates;
  southwest: MapCoordinates;
  southeast: MapCoordinates;
};

export default EventBounds;
