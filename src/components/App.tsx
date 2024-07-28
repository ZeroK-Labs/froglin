import { useState } from "react";

import { GameEventProvider, usePlayer } from "stores";
import { useTutorialState, useViewState } from "hooks";
import {
  AccountModal,
  CapturedFroglinList,
  InfoBarsContainer,
  LeaderBoard,
  LineMenu,
  Map,
  Tutorial,
} from "components";

export default function App() {
  const [leaderBoard, setLeaderBoard] = useState<boolean>(false);

  const { hasSecret } = usePlayer();
  const { tutorial, setTutorial } = useTutorialState();
  const { view, setView } = useViewState();

  return (
    <>
      <GameEventProvider>
        <Map view={view} />
        <InfoBarsContainer
          view={view}
          visible={!tutorial && !leaderBoard}
        />
        <Tutorial
          tutorial={tutorial}
          setTutorial={setTutorial}
        />
        <LineMenu
          setLeaderBoard={setLeaderBoard}
          setTutorial={setTutorial}
          view={view}
          setView={setView}
        />
        {hasSecret ? (
          <>
            <CapturedFroglinList />
            <LeaderBoard
              leaderBoard={leaderBoard}
              setLeaderBoard={setLeaderBoard}
            />
          </>
        ) : (
          <AccountModal />
        )}
      </GameEventProvider>
    </>
  );
}
