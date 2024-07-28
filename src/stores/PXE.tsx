import toast from "react-hot-toast";
import { PXE, createPXEClient } from "@aztec/aztec.js";
import { useEffect, useState, useRef } from "react";

import { StoreFactory } from "stores";
import {
  addSocketEventHandler,
  CLIENT_SOCKET,
  removeSocketEventHandler,
  getPXEReadyMessage,
} from "utils/sockets";

type PXEState = {
  pxeClient: PXE | null;
  pxeURL: string;
};

const TIMEOUT = 5_000;

function createSandboxClient() {
  return createPXEClient(process.env.SANDBOX_URL!);
}

function createState(): PXEState {
  const checkingRef = useRef(false);

  const [sandboxClient] = useState<PXE>(createSandboxClient);
  const [pxeClient, setPXEClient] = useState<PXE | null>(null);
  const [pxeURL, setPXEURL] = useState("");
  const [connected, setConnected] = useState(false);

  useEffect(
    () => {
      async function checkConnection() {
        if (checkingRef.current) return;

        checkingRef.current = true;

        try {
          await sandboxClient.getPXEInfo(); // does 4 retries before throwing an error

          setConnected(true);
          //
        } catch (err: unknown) {
          if ((err as TypeError).message === "Failed to fetch") setConnected(false);
        }

        checkingRef.current = false;
      }

      checkConnection();
      const intervalId = setInterval(checkConnection, TIMEOUT);

      return () => {
        clearInterval(intervalId);
      };
    }, //
    [],
  );

  useEffect(
    () => {
      if (!connected) {
        if (!checkingRef.current) toast.error("Aztec Sandbox offline");

        return;
      }

      toast.success("Aztec Sandbox available");

      let toastId = "";
      function handleSocketOpen() {
        toastId = toast.loading("Waiting for PXE...");
      }

      function handleSocketClose() {
        toast.dismiss(toastId);
      }

      let retries = 0;
      function handleRetry() {
        if (retries === 0) {
          toast.error("PXE host offline", { id: toastId });
          console.error("Failed to initialize PXE: service offline");
        }

        retries += 1;
        CLIENT_SOCKET.send("which pxe");

        if (retries === 4) retries = 0;
      }

      async function handlePXEReady(ev: MessageEvent<string>) {
        if (!ev.data.includes("pxe ")) return;

        const url = ev.data.split(" ")[1];

        if (!url) {
          setTimeout(handleRetry, 3_000);

          return;
        }

        const pxe = createPXEClient(url);

        try {
          await pxe.getPXEInfo();
          //
        } catch (err) {
          toast.error("PXE host offline", { id: toastId });
          console.error("Failed to initialize PXE: service offline");

          setTimeout(handleRetry, 3_000);

          return;
        }

        setPXEClient(pxe);
        setPXEURL(url);

        toast.success("PXE available", { id: toastId });
      }

      addSocketEventHandler("open", handleSocketOpen);
      addSocketEventHandler("close", handleSocketClose);
      addSocketEventHandler("message", handlePXEReady);

      handleSocketOpen();
      const ready = getPXEReadyMessage();
      if (ready) handlePXEReady(ready);

      return () => {
        removeSocketEventHandler("message", handlePXEReady);
        removeSocketEventHandler("close", handleSocketClose);
        removeSocketEventHandler("open", handleSocketOpen);
      };
    }, //
    [connected],
  );

  return {
    pxeClient,
    pxeURL,
  };
}

export const { Provider: PXEClientProvider, useProvider: usePXEClient } =
  StoreFactory<PXEState>(createState);
