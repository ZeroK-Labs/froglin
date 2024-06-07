import { Map } from "react-map-gl";

import PlayerMarker from "components/PlayerMarker";
import FroglinMarker from "components/FroglinMarker";
import { dummyLocation } from "mocks/location";
import { generateRandomCoordinates } from "mocks/froglincoords";

export default function MapScreen() {
  const randomFroglins = generateRandomCoordinates(
    dummyLocation,
    30,
    0.004,
    0.0001,
  );
  const closeFroglins = generateRandomCoordinates(
    dummyLocation,
    10,
    0.0005,
    0.0001,
  );
  return (
    <div className="fixed inset-0 h-screen w-screen">
      <Map
        attributionControl={false}
        initialViewState={{
          longitude: dummyLocation.longitude,
          latitude: dummyLocation.latitude,
          zoom: 18,
        }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={process.env.MAPBOX_ACCESS_TOKEN}
        projection={{ name: "globe" }}
        // @ts-ignore make all animations essential
        respectPrefersReducedMotion={false}
      >
        <PlayerMarker location={dummyLocation} />
        {randomFroglins.map((location, index) => (
          <FroglinMarker
            key={index}
            location={location}
          />
        ))}
        {closeFroglins.map((location, index) => (
          <FroglinMarker
            key={index}
            location={location}
          />
        ))}
      </Map>
    </div>
  );
}
