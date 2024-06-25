import { lazy } from "react";

import { useTutorialState, useViewState } from "hooks";
import { GameEventStateProvider, LocationProvider } from "stores";

const InfoBarsContainer = lazy(() => import("components/InfoBarsContainer"));
const LineMenu = lazy(() => import("components/LineMenu"));
const Map = lazy(() => import("components/Map"));
const Tutorial = lazy(() => import("components/Tutorial"));
const PXEConnectionTracker = lazy(() => import("components/PXEConnectionTracker"));

export default function App() {
  const { tutorial, setTutorial } = useTutorialState();
  const { view, setView } = useViewState();

  return (
    <>
      <LocationProvider>
        <GameEventStateProvider>
          <Map view={view} />

          <InfoBarsContainer
            view={view}
            visible={!tutorial}
          />
          <Tutorial
            tutorial={tutorial}
            setTutorial={setTutorial}
          />
          <LineMenu
            setTutorial={setTutorial}
            view={view}
            setView={setView}
          />
        </GameEventStateProvider>
      </LocationProvider>

      {/* NOTE: when injected into the DOM, the UI thread hangs due to WASM loading */}
      <PXEConnectionTracker />
    </>
  );
}
