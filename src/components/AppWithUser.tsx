import { lazy, useState } from "react";
import { RealEventStateProvider } from "stores";

import { useTutorialState, useViewState } from "hooks";

const InfoBarsContainer = lazy(() => import("components/InfoBarsContainer"));
const LineMenu = lazy(() => import("components/LineMenu"));
const Map = lazy(() => import("components/Map"));
const Tutorial = lazy(() => import("components/Tutorial"));
const LeaderBoard = lazy(() => import("components/LeaderBoard"));

function AppWithUser() {
  const [leaderBoard, setLeaderBoard] = useState<boolean>(false);

  const { tutorial, setTutorial } = useTutorialState();
  const { view, setView } = useViewState();
  return (
    <>
      <RealEventStateProvider>
        <Map view={view} />
        <InfoBarsContainer
          view={view}
          visible={!tutorial}
        />
        <Tutorial
          tutorial={tutorial}
          setTutorial={setTutorial}
        />
        <LeaderBoard
          leaderBoard={leaderBoard}
          setLeaderBoard={setLeaderBoard}
        />
        <LineMenu
          setLeaderBoard={setLeaderBoard}
          setTutorial={setTutorial}
          view={view}
          setView={setView}
        />
      </RealEventStateProvider>
    </>
  );
}

export default AppWithUser;
