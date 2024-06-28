import { useEffect, useState } from "react";

import { LocationProvider, PXEClientProvider } from "stores";
import AppWithoutUser from "components/AppWithoutUser";
import AppWithUser from "components/AppWithUser";

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
          {user ? <AppWithUser /> : <AppWithoutUser setUser={setUser} />}
        </PXEClientProvider>
      </LocationProvider>
    </>
  );
}
