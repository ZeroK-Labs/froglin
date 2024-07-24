import { PXE, createPXEClient } from "@aztec/aztec.js";
import { useEffect, useState, useRef } from "react";

import { CLIENT_SOCKET } from "utils/sockets";
import { StoreFactory } from "stores";
import toast from "react-hot-toast";
import { TimeoutId } from "../../common/types";

type PXEState = {
  connected: boolean;
  sandboxClient: PXE;
  pxeClient: PXE | null;
};

const TIMEOUT = 5_000;

function createSandboxClient() {
  return createPXEClient(process.env.SANDBOX_URL!);
}

function createState(): PXEState {
  const checkingRef = useRef(false);

  const [sandboxClient] = useState<PXE>(createSandboxClient);
  const [pxeClient, setPXEClient] = useState<PXE | null>(null);
  const [connected, setConnected] = useState<boolean>(false);

  async function checkConnection() {
    if (checkingRef.current) return;

    checkingRef.current = true;

    try {
      await sandboxClient.getPXEInfo();

      setConnected(true);
      //
    } catch (e: unknown) {
      if ((e as TypeError).message === "Failed to fetch") {
        setConnected(false);
        toast.error(`Sandbox host ${process.env.SANDBOX_URL} is offline`);
      }
    }

    checkingRef.current = false;
  }

  useEffect(
    () => {
      let timerPXEId: TimeoutId;
      let url = "";

      let handlePXEReady: (event: MessageEvent<string>) => void;

      toast.promise(
        new Promise((resolve, reject) => {
          if (CLIENT_SOCKET.readyState !== WebSocket.OPEN) {
            reject("Socket is closed");
            return;
          }

          handlePXEReady = async (event: MessageEvent<string>) => {
            if (event.data.includes("pxe ")) {
              url = event.data.split(" ")[1];

              const pxe = createPXEClient(url);
              await pxe.getPXEInfo();

              setPXEClient(pxe);

              resolve("");
            }
          };

          CLIENT_SOCKET.addEventListener("message", handlePXEReady);
          CLIENT_SOCKET.send("which pxe");
        }),
        {
          loading: "Waiting for PXE",
          success: "PXE available",
          error: "PXE unavailable",
        },
      );

      checkConnection();
      const intervalConnectionId = setInterval(checkConnection, TIMEOUT);

      return () => {
        clearTimeout(timerPXEId);
        clearInterval(intervalConnectionId);

        CLIENT_SOCKET.removeEventListener("message", handlePXEReady);
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
