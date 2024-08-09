import toast from "react-hot-toast";
import type { AccountWallet } from "@aztec/aztec.js";
import { SetStateAction, useEffect, useState } from "react";

import { FroglinGatewayContract } from "aztec/contracts/gateway/artifact/FroglinGateway";
import { Player } from "frontend/types";
import { StoreFactory, usePXEState } from "frontend/stores";
import { createWallet } from "common/utils/WalletManager";
import { stringToBigInt, bigIntToString } from "common/utils/bigint";

function getSecret() {
  return localStorage.getItem("secret") ?? "";
}

function createState(): Player {
  const [wallet, setWallet] = useState<AccountWallet | null>(null);
  const [gateway, setGateway] = useState<FroglinGatewayContract | null>(null);
  const [secret, setSecret] = useState(getSecret);
  const [username, setUsername] = useState("");

  const { pxeClient, pxeURL } = usePXEState();

  useEffect(
    () => {
      if (!(pxeClient && secret)) {
        setUsername("");
        return;
      }

      async function initializeWallet() {
        const { AztecAddress } = await import("@aztec/aztec.js");
        if (!pxeClient) {
          console.error("Failed to initialize wallet: missing PXE client");
          toast.error("Wallet unavailable");

          return;
        }

        if (!secret) {
          console.error("Failed to initialize wallet: missing secret");
          toast.error("Wallet unavailable");

          return;
        }

        let toastId = toast.loading("Initializing wallet...");

        let wallet: AccountWallet;
        let contract: FroglinGatewayContract;

        try {
          wallet = await createWallet(secret, pxeClient);
          setWallet(wallet);

          toast.loading("Initializing contracts...", { id: toastId });

          const response = await fetch(`${process.env.BACKEND_URL}/gateway`);
          const gatewayAddress = await response.json();

          contract = await FroglinGatewayContract.at(
            AztecAddress.fromString(gatewayAddress),
            wallet,
          );
          setGateway(contract);
          //
        } catch (err) {
          console.error("Failed to initialize wallet", err);
          toast.error("Wallet unavailable", { id: toastId });

          return;
        }

        toast.success("Wallet initialized!", { id: toastId });

        const registered = await contract.methods
          .registered(wallet.getAddress())
          .simulate();

        if (registered) {
          const nameAsBigInt = await contract.methods
            .view_name(wallet.getAddress())
            .simulate();
          const name = bigIntToString(nameAsBigInt);

          setUsername(name);

          toast(`Welcome ${name}!`);

          return;
        }

        if (!username) {
          // console.error("Failed to register player: missing username");
          // toast.error("Failed to register player");
          localStorage.removeItem("secret");
          setSecret("");
          return;
        }

        toastId = toast.loading("Registering new player...");

        const nameAsBigInt = stringToBigInt(username);
        await contract.methods.register(nameAsBigInt).send().wait();

        toast.success("Player registered!", { id: toastId });
        setTimeout(toast, 750, `Welcome ${username}!`);
      }

      initializeWallet();
    }, //
    [pxeClient, secret],
  );

  return {
    username,
    setUsername,
    hasSecret: !!secret,
    setSecret: (newSecret: SetStateAction<string>) => {
      if (typeof newSecret === "function") newSecret = newSecret(secret);
      localStorage.setItem("secret", newSecret);
      setSecret(newSecret);
    },
    aztec:
      pxeClient && wallet && gateway
        ? {
            secret,
            pxe: pxeClient,
            pxe_url: pxeURL,
            wallet,
            contracts: {
              gateway,
            },
          }
        : null,
  };
}

export const { Provider: PlayerProvider, useProvider: usePlayer } =
  StoreFactory<Player>(createState);
