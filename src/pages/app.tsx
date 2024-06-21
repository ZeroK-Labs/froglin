import { InfoBarsContainer, LineMenu, Map, Tutorial } from "components";
import { useTutorialState } from "hooks";

import { GameEventStateProvider, LocationProvider, ViewStateProvider } from "stores";

export default function App() {
  const { tutorial, setTutorial } = useTutorialState();

  return (
    <LocationProvider>
      <ViewStateProvider>
        <GameEventStateProvider>
          <Map />

          <InfoBarsContainer visible={!tutorial} />
          <Tutorial
            tutorial={tutorial}
            setTutorial={setTutorial}
          />
          <LineMenu setTutorial={setTutorial} />
        </GameEventStateProvider>
      </ViewStateProvider>
    </LocationProvider>
  );
}
