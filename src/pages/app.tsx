import { Suspense, useEffect } from "react";

import { InfoBarsContainer, LineMenu, Map, Tutorial } from "components";
import {
  GameEventStateProvider,
  LocationProvider,
  TutorialStateProvider,
  ViewStateProvider,
} from "stores";
import { VIEW } from "settings";

export default function App() {
  useEffect(
    () => {
      const rootElement = document.getElementById("root")!;
      rootElement.style.opacity = "1";
      rootElement.style.transitionDuration = `${VIEW.MAP_LOAD_ANIMATION_DURATION}ms`;
    }, //
    [],
  );

  return (
    <Suspense>
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
    </Suspense>
  );
}
