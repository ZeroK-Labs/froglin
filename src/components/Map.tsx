import { Map } from "react-map-gl";

export default function MapScreen({}) {
  return (
    <div className="fixed inset-0 h-screen w-screen">
      <Map
        attributionControl={false}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={process.env.MAPBOX_ACCESS_TOKEN}
        projection={{ name: "globe" }}
        // @ts-ignore make all animations essential
        respectPrefersReducedMotion={false}
      />
    </div>
  );
}
