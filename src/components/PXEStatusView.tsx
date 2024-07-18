import { usePXEClient } from "stores";

export default function PXEStatusView({}) {
  const { connected, pxeClient } = usePXEClient();

  return (
    <>
      <div
        className={`z-[9999] fixed bottom-2 right-2 text-sm text-red-600 ${pxeClient ? "" : "animate-fade-in-out"}`}
      >
        {connected
          ? pxeClient
            ? "✅"
            : "Initializing PXE 🟨"
          : "Sandbox unavailable 🟥"}
      </div>
      ;
    </>
  );
}
