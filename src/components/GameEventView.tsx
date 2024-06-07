import { useEffect, useRef } from "react";
import { GeoJSONSource, Layer, Source, useMap } from "react-map-gl";

import { GameEvent } from "types";
import { generateEventBounds } from "mocks/eventBounds";
import {
  generateSpreadOutFroglinsCoordinates,
  generateCloseFroglinsCoordinates,
} from "mocks/froglincoords";

const duration = 3_000;

type Props = {
  game: GameEvent;
};

export default function GameEventView({ game }: Props) {
  const map = useMap().current?.getMap();
  const tickerRef = useRef<ReturnType<typeof setInterval>>();

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

    clearInterval(tickerRef.current);
    game.startTime = Date.now();
    tickerRef.current = setInterval(() => {
      const diff = Date.now() - game.startTime;

      // console.log(Math.floor(diff/1000));

      if (diff >= game.timePerEpoch) {
        game.startTime = Date.now();
        game.epochs -= 1;

        game.froglinCoordinates = {
          spreadOut: generateSpreadOutFroglinsCoordinates(game.location),
          close: generateCloseFroglinsCoordinates(game.location),
        };
      }
    }, 1_000);

    return () => {
      clearInterval(tickerRef.current);
    };
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
}
