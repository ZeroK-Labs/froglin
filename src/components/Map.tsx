import { Map } from "react-map-gl";

import PlayerMarker from "components/PlayerMarker";
import { dummyLocation } from "mocks/location";

export default function MapScreen() {
  return (
    <div className="fixed inset-0 h-screen w-screen">
      <Map
        attributionControl={false}
        initialViewState={{
          longitude: dummyLocation.longitude,
          latitude: dummyLocation.latitude,
          zoom: 14,
        }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={process.env.MAPBOX_ACCESS_TOKEN}
        projection={{ name: "globe" }}
        // @ts-ignore make all animations essential
        respectPrefersReducedMotion={false}
      >
        <PlayerMarker location={dummyLocation} />
      </Map>
    </div>
  );
}
