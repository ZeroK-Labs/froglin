import toast from "react-hot-toast";
import { AztecAddress, Contract } from "@aztec/aztec.js";
import { useEffect, useState } from "react";

import { FroglinGatewayContract } from "../../aztec/contracts/gateway/artifact/FroglinGateway";
import { GameEventProvider, usePXEClient } from "stores";
import { bigIntToString, stringToBigInt } from "../../common/utils/bigint";
import { createWallet } from "../../common/WalletManager";
import { useTutorialState, useViewState } from "hooks";
import {
  CapturedFroglinList,
  InfoBarsContainer,
  LeaderBoard,
  LineMenu,
  Map,
  Tutorial,
} from "components";

function AppWithUser() {
  const [leaderBoard, setLeaderBoard] = useState<boolean>(false);
  const [gatewayAddress, setGatewayAddress] = useState<string>("");

  const { tutorial, setTutorial } = useTutorialState();
  const { view, setView } = useViewState();
  const { pxeClient } = usePXEClient();

  useEffect(
    () => {
      async function fetchGatewayAddress() {
        try {
          const response = await fetch(`${process.env.BACKEND_URL}/gateway`);
          const data = await response.json();

          // TODO: this could load slower than (or after) the PXEClient
          setGatewayAddress(data);
          //
        } catch (error) {
          console.error("Failed to fetch gateway address", error);
        }
      }

      fetchGatewayAddress();
    }, //
    [],
  );

  useEffect(
    () => {
      if (!pxeClient) return;

      async function initializeWallet() {
        if (!pxeClient) return;

        const secretString = localStorage.getItem("user");
        if (!secretString) {
          throw "Failed to get secret: key 'user' missing from localStorage";
        }

        const promise = createWallet(secretString, pxeClient);
        toast.promise(promise, {
          loading: "Initializing wallet...",
          success: "Wallet initialized!",
          error: (err) => `This just happened: ${err.toString()}`,
        });

        const wallet = await promise;

        const contract = await Contract.at(
          AztecAddress.fromString(gatewayAddress),
          FroglinGatewayContract.artifact,
          wallet,
        );

        let name = localStorage.getItem("username") || "abc";
        try {
          const registered = await contract.methods
            .registered(wallet.getAddress())
            .simulate();

          if (!registered) {
            const nameAsField = stringToBigInt(name);
            await contract.methods.register(nameAsField).send().wait();
          }

          const nameAsField = await contract.methods
            .view_name(wallet.getAddress())
            .simulate();
          name = bigIntToString(nameAsField);

          console.log(name);
          //
        } catch (err) {
          console.log(err);
        }
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
