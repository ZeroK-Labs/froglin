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
  Menu,
  Map,
  ToastView,
  TutorialModal,
} from "frontend/components";
import AlbumModal from "./components/AlbumModal";
import FroglinModal from "./components/FroglinModal";
import BattleModal from "./components/BattleModal";
import SwapModal from "./components/SwapModal";
import NoticesModal from "./components/NoticeBoardModal";
import ClaimsModal from "./components/ClaimsModal";

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
            <NoticesModal />
            <ClaimsModal />
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
