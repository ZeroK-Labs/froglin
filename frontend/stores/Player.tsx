import toast from "react-hot-toast";
import { AztecAddress, type AccountWallet, createPXEClient, Fr } from "@aztec/aztec.js";
import { SetStateAction, useEffect, useState } from "react";

import type { Player } from "frontend/types";
import { FROGLIN } from "frontend/settings";
import { FroglinGatewayContract } from "aztec/contracts/gateway/artifact/FroglinGateway";
import { StoreFactory, usePXEState } from "frontend/stores";
import { addSocketEventHandler } from "frontend/utils/sockets";
import { createWallet } from "common/utils/WalletManager";
import { stringToBigInt, bigIntToString } from "common/utils/bigint";

function getSecret() {
  return localStorage.getItem("secret") ?? "";
}

function createState(): Player {
  const [wallet, setWallet] = useState<AccountWallet | null>(null);
  const [gateway, setGateway] = useState<FroglinGatewayContract | null>(null);
  const [secret, setSecret] = useState(getSecret);
  const [username, setUsername] = useState<string>("");
  const [traderId, setTraderId] = useState<bigint | null>(null);
  const [registered, setRegistered] = useState<boolean>(false);
  const [stash, setStash] = useState<number[]>(() => Array(FROGLIN.TYPE_COUNT).fill(0));

  const { pxeClient, pxeURL } = usePXEState();

  async function fetchStash() {
    if (!wallet || !gateway || !registered) return;

    const playerAddress = wallet.getAddress();
    const stash = await gateway.methods.view_stash(playerAddress).simulate();

    if (!stash || stash.length === 0) return;

    const numberList = stash.map((bi: bigint) => Number(bi));
    setStash(numberList);
  }

  useEffect(
    () => {
      if (!(pxeClient && secret)) {
        setUsername("");

        return;
      }

      async function initializeWallet() {
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

        let PXEs: string[] = [];
        try {
          const response = await fetch(`${process.env.BACKEND_URL}/PXEs`);
          PXEs = await response.json();
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_err) {
          return;
        }

        let promises: Promise<any>[] = [];

        for (const playerPXEURL of PXEs) {
          if (playerPXEURL === pxeURL) continue;

          const pxeClient = createPXEClient(playerPXEURL);
          promises.push(
            pxeClient.registerAccount(
              new Fr(BigInt(secret)),
              wallet.getCompleteAddress().partialAddress,
            ),
          );
        }

        await Promise.all(promises);

        async function handleNewPlayerJoined(ev: MessageEvent<string>) {
          if (!ev.data.includes("newPlayer ")) return;

          const url = ev.data.split(" ")[1];

          if (!url) return;
          if (url === pxeURL) return;

          const pxeClient = createPXEClient(url);
          await pxeClient.registerAccount(
            new Fr(BigInt(secret)),
            wallet.getCompleteAddress().partialAddress,
          );
        }

        addSocketEventHandler("message", handleNewPlayerJoined);

        toast.success("Wallet initialized!", { id: toastId });

        const registered = await contract.methods
          .registered(wallet.getAddress())
          .simulate();

        if (registered) {
          const nameAsBigInt = await contract.methods
            .view_name(wallet.getAddress())
            .simulate();
          const name = bigIntToString(nameAsBigInt);

          const profile = await contract.methods
            .view_profile(wallet.getAddress())
            .simulate();

          setTraderId(profile.trader_id);
          setUsername(name);
          setRegistered(true);
          fetchStash();

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

        setRegistered(true);

        toast.success("Player registered!", { id: toastId });
        setTimeout(toast, 750, `Welcome ${username}!`);
      }

      initializeWallet();
    }, //
    [pxeClient, pxeURL, secret],
  );

  return {
    username,
    setUsername,
    traderId,
    registered,
    hasSecret: !!secret,
    setSecret: (newSecret: SetStateAction<string>) => {
      if (typeof newSecret === "function") newSecret = newSecret(secret);
      localStorage.setItem("secret", newSecret);
      setSecret(newSecret);
    },
    stash,
    fetchStash,
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
