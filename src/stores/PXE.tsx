import toast from "react-hot-toast";
import { PXE, createPXEClient } from "@aztec/aztec.js";
import { useEffect, useState } from "react";

import { StoreFactory } from "src/stores";
import {
  addSocketEventHandler,
  CLIENT_SOCKET,
  removeSocketEventHandler,
  getPXEReadyMessage,
} from "src/utils/sockets";

type PXEState = {
  pxeClient: PXE | null;
  pxeURL: string;
};

function createState(): PXEState {
  const [pxeClient, setPXEClient] = useState<PXE | null>(null);
  const [pxeURL, setPXEURL] = useState("");

  useEffect(
    () => {
      let toastId = "";
      let timerId: Timer;
      function handleSocketOpen() {
        toastId = toast.loading("Waiting for PXE...");
        // timerId = setTimeout(CLIENT_SOCKET.send, 3_000, "which pxe");
      }

      function handleSocketClose() {
        toast.dismiss(toastId);

        setPXEClient(null);
        setPXEURL("");
      }

      let retries = 0;
      function handlePXEError() {
        if (retries === 0) {
          toast.error("PXE host offline", { id: toastId });
          console.error("Failed to initialize PXE: host offline");
        }
        retries += 1;
        if (retries === 4) retries = 0;

        // retry after 3 seconds
        setTimeout(CLIENT_SOCKET.send, 3_000, "which pxe");
      }

      async function handlePXEReady(ev: MessageEvent<string>) {
        if (!ev.data.includes("pxe ")) return;

        clearTimeout(timerId);

        const url = ev.data.split(" ")[1];
        if (!url) {
          handlePXEError();

          return;
        }

        const pxe = createPXEClient(url);
        try {
          await pxe.getPXEInfo();
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_err) {
          handlePXEError();

          return;
        }

        setPXEClient(pxe);
        setPXEURL(url);

        toast.success("PXE available", { id: toastId });
      }

      addSocketEventHandler("open", handleSocketOpen);
      addSocketEventHandler("close", handleSocketClose);
      addSocketEventHandler("message", handlePXEReady);

      if (CLIENT_SOCKET.readyState === WebSocket.OPEN) {
        handleSocketOpen();
        const ready = getPXEReadyMessage();
        if (ready) handlePXEReady(ready);
      }

      // CLIENT_SOCKET.send("which pxe");

      return () => {
        removeSocketEventHandler("message", handlePXEReady);
        removeSocketEventHandler("close", handleSocketClose);
        removeSocketEventHandler("open", handleSocketOpen);
      };
    }, //
    [],
  );

  return {
    pxeClient,
    pxeURL,
  };
}

export const { Provider: PXEClientProvider, useProvider: usePXEClient } =
  StoreFactory<PXEState>(createState);
