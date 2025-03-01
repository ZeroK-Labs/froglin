import toast from "react-hot-toast";
import { type PXE } from "@aztec/aztec.js";
import { createPXEClient } from "@aztec/aztec.js";
import { useEffect, useRef, useState } from "react";

import { type PXEState } from "frontend/types";
import { StoreFactory } from "frontend/stores";
import {
  CLIENT_SOCKET,
  addSocketEventHandler,
  getPXEReadyMessage,
  removeSocketEventHandler,
} from "frontend/utils/sockets";

function createState(): PXEState {
  const pxeRef = useRef<PXE | null>(null);

  const [pxeURL, setPXEURL] = useState("");

  useEffect(
    () => {
      let toastId = "";

      function handleSocketOpen() {
        toastId = toast.loading("Waiting for PXE...");
      }

      function handleSocketClose() {
        if (toastId) toast.dismiss(toastId);

        pxeRef.current = null;
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

        pxeRef.current = pxe;
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

      return () => {
        removeSocketEventHandler("message", handlePXEReady);
        removeSocketEventHandler("close", handleSocketClose);
        removeSocketEventHandler("open", handleSocketOpen);
      };
    }, //
    [],
  );

  return {
    pxeClient: pxeRef.current,
    pxeURL,
  };
}

export const { Provider: PXEStateProvider, useProvider: usePXEState } =
  StoreFactory<PXEState>(createState);
