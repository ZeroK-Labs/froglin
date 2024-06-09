import { Position } from "geojson";
import { GeoJSONSource, Layer, Source, useMap } from "react-map-gl";
import { useEffect, useRef } from "react";

import { GameEvent } from "types";

const showDuration = 3_000;
const hideDuration = 1_000;

type Props = {
  game: GameEvent;
  visible: boolean;
};

function setBoundsData(
  map: mapboxgl.Map,
  coordinates: Position[][],
  visible: boolean,
) {
  (map.getSource("eventBounds") as GeoJSONSource).setData({
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates },
  });

  if (!visible) return;

  map.setPaintProperty("area", "fill-opacity", 0.5);
  map.setPaintProperty("outline", "line-blur", 3);
}

function updateBounds(
  map: mapboxgl.Map,
  coordinates: Position[][],
  visible: boolean,
) {
  if (!map || !map.getLayer("area")) {
    setTimeout(updateBounds, 500);

    return;
  }

  map.setPaintProperty("area", "fill-opacity", 0);
  map.setPaintProperty("outline", "line-blur", 15);

  if (visible) {
    setBoundsData(map, coordinates, visible);

    return;
  }

  // delay data deletion from source to allow fadeout animation to complete
  setTimeout(() => setBoundsData(map, [], visible), hideDuration);
}

export default function GameEventView({ game, visible }: Props) {
  const map = useMap().current?.getMap();
  const durationRef = useRef(showDuration);

  useEffect(() => {
    durationRef.current = visible ? hideDuration : showDuration;
    updateBounds(map!, game.bounds, visible);
  }, [visible]);

  return (
    <>
      {/* datasource */}
      <Source
        id="eventBounds"
        type="geojson"
        data={{
          type: "Feature",
          properties: {},
          geometry: { type: "Polygon", coordinates: [[[]]] },
        }}
      />

      {/* event bounds polygon */}
      <Layer
        id="area"
        type="fill"
        source="eventBounds"
        paint={{
          "fill-color": "#581C87",
          "fill-opacity": 0,
          "fill-opacity-transition": { duration: durationRef.current },
        }}
      />
      {/* outline */}
      <Layer
        id="outline"
        type="line"
        source="eventBounds"
        paint={{
          "line-color": "green",
          "line-width": 5,
          "line-blur": 15,
          "line-blur-transition": { duration: durationRef.current },
        }}
      />
    </>
  );
}
