import { useState } from "react";
import { ToastBar, Toaster } from "react-hot-toast";

import AppWithUser from "components/AppWithUser";
import AppWithoutUser from "components/AppWithoutUser";
import { LocationProvider, PXEClientProvider } from "stores";

export default function App() {
  const [user, setUser] = useState(false);

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
            zIndex: "9999",
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
      ;
      <LocationProvider>
        <PXEClientProvider>
          {user ? <AppWithUser /> : <AppWithoutUser setUser={setUser} />}
        </PXEClientProvider>
      </LocationProvider>
    </>
  );
}
