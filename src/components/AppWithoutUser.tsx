import SignInScreen from "./SignInScreen";
import { GameEventProvider } from "stores";
import { useTutorialState, useViewState } from "hooks";

import { Map, InfoBarsContainer, LineMenu, Tutorial } from "components";

function AppWithoutUser({ setUser }: { setUser: (a: boolean) => void }) {
  const { tutorial, setTutorial } = useTutorialState();
  const { view, setView } = useViewState();

  return (
    <>
      <GameEventProvider>
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
        <SignInScreen setUser={setUser} />
      </GameEventProvider>
    </>
  );
}

export default AppWithoutUser;
