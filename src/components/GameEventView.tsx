import { useEffect } from "react";
import { GeoJSONSource, Layer, Source, useMap } from "react-map-gl";

import { GameEvent, MapCoordinates } from "types";
import { generateEventBounds } from "mocks/eventBounds";
import {
  generateSpreadOutFroglinsCoordinates,
  generateCloseFroglinsCoordinates,
} from "mocks/froglincoords";

const duration = 3_000;

type Props = {
  game: GameEvent;
};

export const GameEventView = ({ game }: Props) => {
  const map = useMap().current?.getMap();

  function updateData() {
    if (!map) return;

    if (!map.getLayer("area")) {
      setTimeout(updateData, 500);

      return;
    }

    map.setPaintProperty("area", "fill-opacity", 0);
    map.setPaintProperty("outline", "line-blur", 15);

    (map.getSource("eventBounds") as GeoJSONSource).setData({
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates: game.bounds },
    });

    setTimeout(() => {
      map.setPaintProperty("area", "fill-opacity", 0.5);
      map.setPaintProperty("outline", "line-blur", 3);
    }, 2_000);
  }

  useEffect(() => {
    if (!(map && game.location)) return;

    game.bounds = generateEventBounds(game.location);
    game.froglinCoordinates = {
      spreadOut: generateSpreadOutFroglinsCoordinates(game.location),
      close: generateCloseFroglinsCoordinates(game.location),
    };

    updateData();
  }, [map, game.location]);

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
          "fill-opacity-transition": { duration },
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
          "line-blur-transition": { duration },
        }}
      />
    </>
  );
};
