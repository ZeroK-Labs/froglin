import { PXE, createPXEClient } from "@aztec/aztec.js";
import { useState, useEffect } from "react";

const TIMEOUT = 5_000;
const URL = process.env.PXE_URL!;

export const PXEConnectionTracker = () => {
  const [pxeClient] = useState<PXE>(createPXEClient(URL));
  const [connected, setConnected] = useState(false);

  function handleError(e: TypeError) {
    console.log(e);

    if (e.message === "Failed to fetch") {
      if (!connected) setTimeout(testConnection, TIMEOUT);
      setConnected(false);
    }
  }

  function handleDiscovery(value: number) {
    console.log(value);

    setConnected(true);
  }

  function testConnection() {
    pxeClient
      .getBlockNumber()
      .then(connected ? testLiveness : handleDiscovery)
      .catch(handleError);
  }

  function testLiveness() {
    setTimeout(testConnection, TIMEOUT);
  }

  useEffect(() => {
    connected ? testLiveness() : testConnection();
  }, [connected]);

  return (
    <div
      className={`absolute bottom-4 right-4 ${connected ? "" : "animate-fade-in-out"}`}
    >
      {connected ? "✅" : "🟥"}
    </div>
  );
};
