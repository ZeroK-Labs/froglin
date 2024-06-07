import { Map, MapRef } from "react-map-gl";
import { useEffect, useRef } from "react";

import useLocation from "hooks/useLocation";
import { FroglinMarker, GameEventView, PlayerMarker } from "components";
import { GameEvent } from "types";

export default function MapScreen() {
  const location = useLocation();
  const flownIn = useRef(false);
  const gameEventRef = useRef<GameEvent>({
    location: { latitude: 0, longitude: 0 },
    bounds: [],
    epochs: 100,
    timePerEpoch: 30_000,
    startTime: 0,
    froglinCoordinates: {
      spreadOut: [],
      close: [],
    },
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
    if (!location.initial) {
      gameEventRef.current.location = { latitude: 0, longitude: 0 };

      return;
    }

    gameEventRef.current.location = location.initial;
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

            {gameEventRef.current.froglinCoordinates.spreadOut.map(
              (location, index) => (
                <FroglinMarker
                  key={index}
                  location={location}
                />
              ),
            )}
            {gameEventRef.current.froglinCoordinates.close.map(
              (location, index) => (
                <FroglinMarker
                  key={index}
                  location={location}
                />
              ),
            )}

            <GameEventView game={gameEventRef.current} />
          </>
        ) : null}
      </Map>
    </div>
  );
}
