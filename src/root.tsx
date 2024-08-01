import { Suspense, lazy } from "react";

import { LoadingFallback } from "components";
import { createSocketClient } from "utils/sockets";

const App = lazy(() => import("./app"));

createSocketClient();

export default function Root() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <App />
    </Suspense>
  );
}
