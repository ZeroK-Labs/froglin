import { useEffect, useRef } from "react";
import { Map, MapRef } from "react-map-gl";

import FroglinMarker from "components/FroglinMarker";
import MapCoordinates from "types/MapCoordinates";
import PlayerMarker from "components/PlayerMarker";
import useLocation from "hooks/useLocation";
import {
  generateCloseFroglinsCoordinates,
  generateWideFroglinsCoordinates,
} from "mocks/froglincoords";

export default function MapScreen() {
  const location = useLocation();
  const flownIn = useRef(false);

  const froglinCoordinates = useRef({
    wide: [] as MapCoordinates[],
    close: [] as MapCoordinates[],
  });

  function mapCallback(node: MapRef) {
    if (flownIn.current) return;

    if (!node) return;

    if (node.isMoving()) return;

    if (!location.current) {
      flownIn.current = false;
      return;
    }

    flownIn.current = true;

    node.flyTo({
      center: [location.current.longitude, location.current.latitude],
      zoom: 17,
      pitch: 60,
      bearing: -30,
      duration: 7000,
    });
  }

  useEffect(() => {
    if (!location.initial) return;

    froglinCoordinates.current = {
      wide: generateWideFroglinsCoordinates(location.initial),
      close: generateCloseFroglinsCoordinates(location.initial),
    };
  }, [location.initial]);

  return (
    <div className="fixed inset-0 h-screen w-screen">
      <Map
        ref={mapCallback}
        mapboxAccessToken={process.env.MAPBOX_ACCESS_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        attributionControl={false}
        projection={{ name: "globe" }}
        // @ts-ignore make all animations essential
        respectPrefersReducedMotion={false}
      >
        {location.current ? (
          <>
            <PlayerMarker location={location.current} />

            {froglinCoordinates.current.wide.map((location, index) => (
              <FroglinMarker
                key={index}
                location={location}
              />
            ))}
            {froglinCoordinates.current.close.map((location, index) => (
              <FroglinMarker
                key={index}
                location={location}
              />
            ))}
          </>
        ) : null}
      </Map>
    </div>
  );
}
