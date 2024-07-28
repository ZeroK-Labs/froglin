import { ToastBar, Toaster } from "react-hot-toast";

import App from "components/App";
import { PlayerProvider, LocationProvider, PXEClientProvider } from "stores";

export default function Home() {
  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 6_000,
          style: {
            flexDirection: "row-reverse",
            background: "#363636",
            color: "#fff",
            fontSize: "16pt",
          },
          success: {
            duration: 2_000,
          },
        }}
      >
        {(t) => (
          <div className={t.visible ? "animate-toast-in" : "animate-toast-out"}>
            <ToastBar toast={t} />
          </div>
        )}
      </Toaster>

      <LocationProvider>
        <PXEClientProvider>
          <PlayerProvider>
            <App />
          </PlayerProvider>
        </PXEClientProvider>
      </LocationProvider>
    </>
  );
}
