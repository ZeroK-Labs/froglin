import { PXE, createPXEClient } from "@aztec/aztec.js";
import { useState, useEffect, useRef } from "react";

const TIMEOUT = 5_000;

function createClient() {
  return createPXEClient(process.env.PXE_URL!);
}

export default function PXEConnectionTracker() {
  const checkingRef = useRef(false);

  const [pxeClient] = useState<PXE>(createClient);
  const [connected, setConnected] = useState(false);

  async function checkConnection() {
    if (checkingRef.current) return;

    checkingRef.current = true;

    try {
      const blockNumber = await pxeClient.getBlockNumber();

      console.log(blockNumber);
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
  );

  return (
    <div
      className={`z-[9998] fixed bottom-2 right-2 text-sm ${connected ? "" : "animate-fade-in-out"}`}
    >
      {connected ? "✅" : "🟥"}
    </div>
  );
}
