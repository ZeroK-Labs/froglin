import { PXE, createPXEClient } from "@aztec/aztec.js";
import { useEffect, useState, useRef } from "react";

import { CLIENT_SOCKET } from "utils/sockets";
import { StoreFactory } from "stores";

type PXEState = {
  connected: boolean;
  sandboxClient: PXE;
  pxeClient: PXE | null;
};

const TIMEOUT = 5_000;

function createSandboxClient() {
  return createPXEClient(process.env.PXE_URL!);
}

function createState(): PXEState {
  const checkingRef = useRef(false);

  const [connected, setConnected] = useState<boolean>(false);
  const [sandboxClient] = useState<PXE>(createSandboxClient);
  const [pxeClient, setPXEClient] = useState<PXE | null>(null);

  async function checkConnection() {
    if (checkingRef.current) return;

    checkingRef.current = true;

    try {
      await sandboxClient.getBlockNumber();

      setConnected(true);
      //
    } catch (e: unknown) {
      if ((e as TypeError).message === "Failed to fetch") setConnected(false);
    }

    checkingRef.current = false;
  }

  useEffect(
    () => {
      checkConnection();
      const timer = setInterval(checkConnection, TIMEOUT);

      function handlePXEReady(event: MessageEvent<string>) {
        if (event.data.includes("ready ")) {
          const url = event.data.split(" ")[1];

          console.log(url);
          setPXEClient(createPXEClient(url));
        }
      }

      CLIENT_SOCKET.addEventListener("message", handlePXEReady);

      return () => {
        CLIENT_SOCKET.removeEventListener("message", handlePXEReady);

        clearInterval(timer);
      };
    }, //
    [],
  );

  return {
    connected,
    pxeClient,
    sandboxClient,
  };
}

export const { Provider: PXEClientProvider, useProvider: usePXEClient } =
  StoreFactory<PXEState>(createState);
