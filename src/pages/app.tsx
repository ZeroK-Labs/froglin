import { InfoBarsContainer, LineMenu, Map, Tutorial } from "components";

import {
  GameEventStateProvider,
  LocationProvider,
  TutorialStateProvider,
  ViewStateProvider,
} from "stores";

export default function App() {
  return (
    <LocationProvider>
      <ViewStateProvider>
        <GameEventStateProvider>
          <Map />

          <TutorialStateProvider>
            <InfoBarsContainer />
            <Tutorial />
            <LineMenu />
          </TutorialStateProvider>
        </GameEventStateProvider>
      </ViewStateProvider>
    </LocationProvider>
  );
}
