import { lazy, useEffect, useState } from "react";
import { GameEventProvider, usePXEClient } from "stores";

import { useTutorialState, useViewState } from "hooks";
import { SingleKeyAccountContract } from "@aztec/accounts/single_key";
import {
  Fr,
  deriveMasterIncomingViewingSecretKey,
  AccountManager,
} from "@aztec/aztec.js";

const InfoBarsContainer = lazy(() => import("components/InfoBarsContainer"));
const LineMenu = lazy(() => import("components/LineMenu"));
const Map = lazy(() => import("components/Map"));
const Tutorial = lazy(() => import("components/Tutorial"));
const LeaderBoard = lazy(() => import("components/LeaderBoard"));

function AppWithUser() {
  const [leaderBoard, setLeaderBoard] = useState<boolean>(false);

  const { tutorial, setTutorial } = useTutorialState();
  const { view, setView } = useViewState();
  const { pxeClient } = usePXEClient();

  useEffect(
    () => {
      if (!pxeClient) return;

      async function registerAccount() {
        if (!pxeClient) return;

        const secretString = localStorage.getItem("user");
        if (!secretString) throw "User not found in localStorage";

        const keyFr = new Fr(BigInt(secretString));
        const encryptionPrivateKey = deriveMasterIncomingViewingSecretKey(keyFr);

        const accountContract = new SingleKeyAccountContract(encryptionPrivateKey);
        const accountManager = new AccountManager(pxeClient, keyFr, accountContract);

        const wallet = await accountManager.register();
        if (!wallet) return;
      }

      registerAccount();
    }, //
    [pxeClient],
  );

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
