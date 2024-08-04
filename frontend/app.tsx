import {
  GameEventProvider,
  LocationProvider,
  MapViewStateProvider,
  ModalStateProvider,
  PXEStateProvider,
  PlayerProvider,
  usePXEState,
  usePlayer,
} from "frontend/stores";
import {
  AccountModal,
  CapturedFroglinList,
  CreateAccountButton,
  InfoBarsContainer,
  LeaderBoardModal,
  LineMenu,
  Map,
  ToastView,
  TutorialModal,
} from "frontend/components";

function AppComponent() {
  const { hasSecret } = usePlayer();
  const { pxeClient } = usePXEState();

  return (
    <>
      <Map />

      <InfoBarsContainer />
      <CapturedFroglinList />
      <LineMenu />

      <TutorialModal />
      {pxeClient ? (
        hasSecret ? (
          <LeaderBoardModal />
        ) : (
          <>
            <AccountModal />
            <CreateAccountButton />
          </>
        )
      ) : null}
    </>
  );
}

export default function App() {
  const AppWithProviders = [
    MapViewStateProvider,
    ModalStateProvider,
    LocationProvider,
    PXEStateProvider,
    PlayerProvider,
    GameEventProvider,
  ].reduceRight((acc, Provider) => <Provider>{acc}</Provider>, <AppComponent />);

  return (
    <>
      <ToastView />
      {AppWithProviders}
    </>
  );
}
