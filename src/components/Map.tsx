import { GeoJSONSource, Map, MapRef } from "react-map-gl";
import { Position } from "geojson";
import { useEffect, useRef } from "react";

import FroglinMarker from "components/FroglinMarker";
import MapCoordinates from "types/MapCoordinates";
import PlayerMarker from "components/PlayerMarker";
import useLocation from "hooks/useLocation";
import { generateEventBounds } from "mocks/eventBounds";
import {
  generateCloseFroglinsCoordinates,
  generateWideFroglinsCoordinates,
} from "mocks/froglincoords";
import { EventBoundsVisualizer } from "./EventBoundsVisualizer";

export default function MapScreen() {
  const location = useLocation();
  const flownIn = useRef(false);

  const eventBounds = useRef<Position[][]>([]);

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

    function updateData() {
      const map = node.getMap();

      if (!map.getLayer("area")) {
        setTimeout(updateData, 500);

        return;
      }

      map.setPaintProperty("area", "fill-opacity", 0);
      map.setPaintProperty("outline", "line-blur", 15);

      (map.getSource("eventBounds") as GeoJSONSource).setData({
        type: "Feature",
        properties: {},
        geometry: { type: "Polygon", coordinates: eventBounds.current },
      });

      setTimeout(() => {
        map.setPaintProperty("area", "fill-opacity", 0.5);
        map.setPaintProperty("outline", "line-blur", 3);
      }, 2_000);
    }

    updateData();
  }

  useEffect(() => {
    if (!location.initial) return;

    eventBounds.current = generateEventBounds(location.initial);

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
        projection={{ name: "globe" }}
        // disable right-bottom information
        attributionControl={false}
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

            <EventBoundsVisualizer />
          </>
        ) : null}
      </Map>
    </div>
  );
}
