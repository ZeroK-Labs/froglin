import { useEffect, useState } from "react";
import { SingleKeyAccountContract } from "@aztec/accounts/single_key";
import {
  Fr,
  deriveMasterIncomingViewingSecretKey,
  AccountManager,
} from "@aztec/aztec.js";

import { GameEventProvider, usePXEClient } from "stores";
import { useTutorialState, useViewState } from "hooks";
import {
  CapturedFroglinList,
  InfoBarsContainer,
  LeaderBoard,
  LineMenu,
  Map,
  Tutorial,
} from "components";
import toast from "react-hot-toast";

function AppWithUser() {
  const [leaderBoard, setLeaderBoard] = useState<boolean>(false);

  const { tutorial, setTutorial } = useTutorialState();
  const { view, setView } = useViewState();
  const { pxeClient } = usePXEClient();

  useEffect(
    () => {
      if (!pxeClient) return;

      function initializeWallet() {
        if (!pxeClient) return;

        const secretString = localStorage.getItem("user");
        if (!secretString) {
          throw "Failed to get secret: key 'user' missing from localStorage";
        }

        const keyFr = new Fr(BigInt(secretString));
        const encryptionPrivateKey = deriveMasterIncomingViewingSecretKey(keyFr);

        const accountContract = new SingleKeyAccountContract(encryptionPrivateKey);
        const accountManager = new AccountManager(pxeClient, keyFr, accountContract);

        toast.promise(accountManager.register(), {
          loading: "Initializing wallet...",
          success: (wallet) => {
            console.log("wallet ready", wallet.getAddress().toString());
            return "Wallet initialized!";
          },
          error: (err) => `This just happened: ${err.toString()}`,
        });
      }

      initializeWallet();
    }, //
    [pxeClient],
  );

  return (
    <>
      <GameEventProvider>
        <Map view={view} />
        <CapturedFroglinList />
        <InfoBarsContainer
          view={view}
          visible={!tutorial && !leaderBoard}
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
