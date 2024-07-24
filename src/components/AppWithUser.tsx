import { useState } from "react";
import { GameEventProvider } from "stores";

import { useTutorialState, useViewState } from "hooks";

import {
  CapturedFroglinList,
  InfoBarsContainer,
  LeaderBoard,
  LineMenu,
  Map,
  Tutorial,
} from "components";

// import { lazy } from "react";

// const InfoBarsContainer = lazy(() => import("components/InfoBarsContainer"));
// const LineMenu = lazy(() => import("components/LineMenu"));
// const Map = lazy(() => import("components/Map"));
// const Tutorial = lazy(() => import("components/Tutorial"));
// const LeaderBoard = lazy(() => import("components/LeaderBoard"));
// const CapturedFroglinList = lazy(() => import("components/CapturedFroglinList"));

function AppWithUser() {
  const [leaderBoard, setLeaderBoard] = useState<boolean>(false);

  const { tutorial, setTutorial } = useTutorialState();
  const { view, setView } = useViewState();

  return (
    <>
      <GameEventProvider>
        <Map view={view} />
        <CapturedFroglinList />
        <InfoBarsContainer
          view={view}
          visible={!tutorial && !leaderBoard}
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
      </GameEventProvider>
    </>
  );
}

export default AppWithUser;
