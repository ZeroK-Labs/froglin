import { useState } from "react";

import { GameEventProvider, useAccountWithContracts } from "stores";
import { useTutorialState, useViewState } from "hooks";
import {
  CapturedFroglinList,
  InfoBarsContainer,
  LeaderBoard,
  LineMenu,
  Map,
  Tutorial,
} from "components";
import SignInScreen from "./SignInScreen";

function App() {
  const [leaderBoard, setLeaderBoard] = useState<boolean>(false);
  const { isSignedIn } = useAccountWithContracts();
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
        {isSignedIn ? <CapturedFroglinList /> : null}
        {isSignedIn ? (
          <LeaderBoard
            leaderBoard={leaderBoard}
            setLeaderBoard={setLeaderBoard}
          />
        ) : null}
        <LineMenu
          setLeaderBoard={setLeaderBoard}
          setTutorial={setTutorial}
          view={view}
          setView={setView}
        />
        {!isSignedIn ? <SignInScreen /> : null}
      </GameEventProvider>
    </>
  );
}

export default App;
