import { useEffect, useState } from "react";

import { GameEventProvider, usePlayer, usePXEClient } from "stores";
import { MAP_VIEWS, MODALS } from "enums";
import {
  AccountModal,
  CapturedFroglinList,
  CreateAccountButton,
  InfoBarsContainer,
  LeaderBoardModal,
  LineMenu,
  Map,
  TutorialModal,
} from "components";

export default function App() {
  const [view, setView] = useState(MAP_VIEWS.PLAYGROUND);
  const [modal, setModal] = useState(MODALS.NONE);

  const { hasSecret } = usePlayer();
  const { pxeClient } = usePXEClient();

  // view change on keypress
  useEffect(
    () => {
      function handleKeyPress(ev: KeyboardEvent) {
        if (ev.key === "1") setView(MAP_VIEWS.PLAYGROUND);
        else if (ev.key === "2") setView(MAP_VIEWS.EVENT);
      }

      document.addEventListener("keypress", handleKeyPress);

      return () => {
        document.removeEventListener("keypress", handleKeyPress);
      };
    }, //
    [],
  );

  return (
    <GameEventProvider>
      <Map view={view} />
      <InfoBarsContainer
        view={view}
        visible={modal !== MODALS.TUTORIAL && modal !== MODALS.LEADERBOARD}
      />
      <CapturedFroglinList />
      <LineMenu
        modal={modal}
        setModal={setModal}
        view={view}
        setView={setView}
      />
      <TutorialModal
        modal={modal}
        setModal={setModal}
      />
      {pxeClient ? (
        hasSecret ? (
          <LeaderBoardModal
            modal={modal}
            setModal={setModal}
          />
        ) : (
          <>
            <AccountModal
              modal={modal}
              setModal={setModal}
            />
            <CreateAccountButton
              modal={modal}
              setModal={setModal}
            />
          </>
        )
      ) : null}
    </GameEventProvider>
  );
}
