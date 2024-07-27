import toast from "react-hot-toast";
import React, { Dispatch, useEffect, useState } from "react";
import { FroglinGatewayContract } from "../../aztec/contracts/gateway/artifact/FroglinGateway";

import { StoreFactory, usePXEClient } from "stores";
import { Contract, AztecAddress } from "@aztec/aztec.js";
import { createWallet } from "../../common/WalletManager";
import { stringToBigInt, bigIntToString } from "../../common/utils/bigint";

type AccountWithContractsState = {
  gatewayContract: Contract | null;
  wallet: any;
  isFormReady: boolean;
  setIsFormReady: Dispatch<React.SetStateAction<boolean>>;
  setUsername: Dispatch<React.SetStateAction<string>>;
  username: string;
  isSignedIn: boolean;
};

function createState(): AccountWithContractsState {
  const { pxeClient, gatewayAddress } = usePXEClient();

  const [isFormReady, setIsFormReady] = useState<boolean>(false);
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [gatewayContract, setGatewayContract] = useState<Contract | null>(null);
  const [wallet, setWallet] = useState<any>(null);

  useEffect(
    () => {
      if (!pxeClient) return;

      async function initializeWallet() {
        if (!pxeClient) return;

        const secretString = localStorage.getItem("user");
        if (!secretString) {
          // throw "Failed to get secret: key 'user' missing from localStorage";
          return;
        }

        const promise = createWallet(secretString, pxeClient);
        toast.promise(promise, {
          loading: "Initializing wallet...",
          success: "Wallet initialized!",
          error: (err) => `This just happened: ${err.toString()}`,
        });

        const wallet = await promise;
        setWallet(wallet);

        const contract = await Contract.at(
          AztecAddress.fromString(gatewayAddress),
          FroglinGatewayContract.artifact,
          wallet,
        );
        setGatewayContract(contract);

        if (isFormReady) {
          const nameAsField = stringToBigInt(username);
          await contract.methods.register(nameAsField).send().wait();
        }
        // const registered = await contract.methods
        //   .registered(wallet.getAddress())
        //   .simulate();

        const promiseNameAsField = contract.methods
          .view_name(wallet.getAddress())
          .simulate();
        // toast name
        toast.promise(
          promiseNameAsField,
          {
            loading: "Reading name from contract",
            success: (name) => {
              setIsSignedIn(true);
              setUsername(bigIntToString(name));
              return "Hello " + bigIntToString(name) + "!";
            },
            error: (err) => `This just happened: ${err.toString()}`,
          },
          {
            duration: 5000,
          },
        );
      }

      initializeWallet();
    }, //
    [pxeClient, isFormReady],
  );
  return {
    gatewayContract,
    wallet,
    setIsFormReady,
    isFormReady,
    setUsername,
    username,
    isSignedIn,
  };
}

export const {
  Provider: AccountWithContractsProvider,
  useProvider: useAccountWithContracts,
} = StoreFactory<AccountWithContractsState>(createState);
