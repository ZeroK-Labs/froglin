import { useState } from "react";

import AppWithoutUser from "components/AppWithoutUser";
import AppWithUser from "components/AppWithUser";
import { LocationProvider, PXEClientProvider } from "stores";
import PXEStatusView from "components/PXEStatusView";

export default function App() {
  const [user, setUser] = useState(false);

  return (
    <>
      <LocationProvider>
        <PXEClientProvider>
          {user ? <AppWithUser /> : <AppWithoutUser setUser={setUser} />}
          <PXEStatusView />
        </PXEClientProvider>
      </LocationProvider>
    </>
  );
}
