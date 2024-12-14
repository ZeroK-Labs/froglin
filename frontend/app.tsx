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
  BattleModal,
  CapturedFroglinList,
  ClaimsModal,
  CreateAccountButton,
  DateModal,
  FroglinModal,
  InfoBarsContainer,
  LeaderBoardModal,
  Map,
  Menu,
  NoticeBoardModal,
  SwapModal,
  ToastView,
  TutorialModal,
} from "frontend/components";
import AlbumModal from "./components/AlbumModal";

function AppComponent() {
  const { hasSecret } = usePlayer();
  const { pxeClient } = usePXEState();

  return (
    <>
      <Map />

      <InfoBarsContainer />
      <CapturedFroglinList />
      <Menu />
      <TutorialModal />
      {pxeClient ? (
        hasSecret ? (
          <>
            <LeaderBoardModal />
            <AlbumModal />
            <FroglinModal />
            <BattleModal />
            <SwapModal />
            <NoticeBoardModal />
            <ClaimsModal />
            <DateModal />
          </>
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
