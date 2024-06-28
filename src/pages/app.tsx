import { useEffect, useState } from "react";

import { GameEventStateProvider, LocationProvider, PXEClientProvider } from "stores";
import AppWithoutUser from "components/AppWithoutUser";
import AppWithUser from "components/AppWithUser";

// const PXEConnectionTracker = lazy(() => import("components/PXEConnectionTracker"));

export default function App() {
  const [user, setUser] = useState(false);

  useEffect(
    () => {
      const loadedUser = localStorage.getItem("user");
      if (loadedUser) {
        const userData = JSON.parse(loadedUser);
        if ((userData.type = "Fq")) {
          setUser(true);
        }
        console.log("User loaded from localStorage:", userData);
      }
    }, //
    [],
  );

  return (
    <>
      <LocationProvider>
        <PXEClientProvider>
          <GameEventStateProvider>
            {user ? <AppWithUser /> : <AppWithoutUser setUser={setUser} />}
          </GameEventStateProvider>
        </PXEClientProvider>
      </LocationProvider>

      {/* NOTE: when injected into the DOM, the UI thread hangs due to WASM loading */}
      {/* <PXEConnectionTracker /> */}
    </>
  );
}
