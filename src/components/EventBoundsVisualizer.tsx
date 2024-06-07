import { Layer, Source } from "react-map-gl";

const duration = 3_000;

export const EventBoundsVisualizer = () => {
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
