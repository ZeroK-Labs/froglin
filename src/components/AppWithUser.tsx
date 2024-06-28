import { lazy } from "react";
import { DemoEventStateProvider } from "stores";

import { useTutorialState, useViewState } from "hooks";

const InfoBarsContainer = lazy(() => import("components/InfoBarsContainer"));
const LineMenu = lazy(() => import("components/LineMenu"));
const Map = lazy(() => import("components/Map"));
const Tutorial = lazy(() => import("components/Tutorial"));

function AppWithUser() {
  const { tutorial, setTutorial } = useTutorialState();
  const { view, setView } = useViewState();
  return (
    <>
      <DemoEventStateProvider>
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
      </DemoEventStateProvider>
    </>
  );
}

export default AppWithUser;
