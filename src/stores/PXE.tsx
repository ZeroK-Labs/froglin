import { PXE, createPXEClient } from "@aztec/aztec.js";

import { useEffect, useState, useRef } from "react";

import { StoreFactory } from "stores";

const TIMEOUT = 5_000;

function createClient() {
  return createPXEClient(process.env.PXE_URL!);
}

function createState(): { pxeClient: PXE; connected: boolean } {
  const checkingRef = useRef(false);

  const [pxeClient] = useState<PXE>(createClient);
  const [connected, setConnected] = useState<boolean>(false);

  async function checkConnection() {
    if (checkingRef.current) return;

    checkingRef.current = true;

    try {
      const blockNumber = await pxeClient.getBlockNumber();

      // console.log(blockNumber);
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

      return () => {
        clearInterval(timer);
      };
    }, //
    [],
  ); // console.log("DeviceLocation createState");

  return {
    pxeClient,
    connected,
  };
}

export const { Provider: PXEClientProvider, useProvider: usePXEClient } = StoreFactory<{
  pxeClient: PXE;
  connected: boolean;
}>(createState);
