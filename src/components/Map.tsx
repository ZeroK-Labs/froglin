import { Map, MapRef } from "react-map-gl";

import PlayerMarker from "components/PlayerMarker";
import useLocation from "hooks/useLocation";
import { useEffect, useRef } from "react";

export default function MapScreen() {
  const location = useLocation();
  const flownIn = useRef(false);

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

  useEffect(() => {}, []);

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
        {location.current ? <PlayerMarker location={location.current} /> : null}
      </Map>
    </div>
  );
}
