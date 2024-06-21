import { InfoBarsContainer, LineMenu, Map, Tutorial } from "components";
import { useTutorialState, useViewState } from "hooks";

import { GameEventStateProvider, LocationProvider } from "stores";

export default function App() {
  const { tutorial, setTutorial } = useTutorialState();
  const { view, setView } = useViewState();

  return (
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
          setView={setView}
        />
      </GameEventStateProvider>
    </LocationProvider>
  );
}
