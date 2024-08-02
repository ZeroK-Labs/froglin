import {
  GameEventProvider,
  LocationProvider,
  MapViewStateProvider,
  ModalStateProvider,
  PXEClientProvider,
  PlayerProvider,
  usePXEClient,
  usePlayer,
} from "src/stores";
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
} from "src/components";

function AppComponent() {
  const { hasSecret } = usePlayer();
  const { pxeClient } = usePXEClient();

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
    PXEClientProvider,
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
