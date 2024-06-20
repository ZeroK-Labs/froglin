import { Layer, Source } from "react-map-gl";

import { useGameEventState } from "stores";

type Props = {
  visible: boolean;
};

const DURATION_SHOW = 3_000;
const DURATION_HIDE = 1_000;

export default function GameEventView(props: Props) {
  const { bounds } = useGameEventState();

  const options = props.visible
    ? {
        areaOpacity: 0.5,
        outlineOpacity: 1,
        duration: DURATION_SHOW,
      }
    : {
        areaOpacity: 0,
        outlineOpacity: 0,
        duration: DURATION_HIDE,
      };

  return (
    <>
      {/* datasource */}
      <Source
        id="eventBounds"
        type="geojson"
        data={{
          type: "Feature",
          properties: null,
          geometry: { type: "Polygon", coordinates: bounds },
        }}
      />

      {/* event bounds polygon */}
      <Layer
        id="area"
        type="fill"
        source="eventBounds"
        paint={{
          "fill-color": "#581C87",
          "fill-opacity": options.areaOpacity,
          "fill-opacity-transition": { duration: options.duration },
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
          "line-blur": 3,
          "line-opacity": options.outlineOpacity,
          "line-blur-transition": { duration: options.duration },
        }}
      />
    </>
  );
}
