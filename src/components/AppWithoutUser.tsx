import { lazy, Dispatch, SetStateAction } from "react";
import SignInScreen from "./SignInScreen";
import { useTutorialState, useViewState } from "hooks";

const InfoBarsContainer = lazy(() => import("components/InfoBarsContainer"));
const LineMenu = lazy(() => import("components/LineMenu"));
const Map = lazy(() => import("components/Map"));
const Tutorial = lazy(() => import("components/Tutorial"));

function AppWithoutUser({ setUser }: { setUser: Dispatch<SetStateAction<boolean>> }) {
  const { tutorial, setTutorial } = useTutorialState();
  const { view, setView } = useViewState();
  return (
    <>
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
    </>
  );
}

export default AppWithoutUser;
