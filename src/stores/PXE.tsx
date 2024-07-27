import toast from "react-hot-toast";
import { PXE, createPXEClient } from "@aztec/aztec.js";
import { useEffect, useState, useRef } from "react";

import { CLIENT_SOCKET } from "utils/sockets";
import { StoreFactory } from "stores";

type PXEState = {
  connected: boolean;
  sandboxClient: PXE;
  pxeClient: PXE | null;
  gatewayAddress: string;
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
  const [gatewayAddress, setGatewayAddress] = useState<string>("");

  // save username here and create wallet when

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
      let url = "";

      let handlePXEReady: (event: MessageEvent<string>) => void;

      if (CLIENT_SOCKET.readyState !== WebSocket.OPEN) {
        toast.error("Socket is closed");
        return;
      }

      toast.promise(
        new Promise((resolve) => {
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
          error: (err) => {
            console.log(err);
            return "PXE unavailable";
          },
        },
      );

      checkConnection();
      const intervalConnectionId = setInterval(checkConnection, TIMEOUT);

      return () => {
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
    gatewayAddress,
  };
}

export const { Provider: PXEClientProvider, useProvider: usePXEClient } =
  StoreFactory<PXEState>(createState);
