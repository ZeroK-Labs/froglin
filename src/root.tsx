import { Suspense, lazy } from "react";

import { LoadingFallback } from "components";

const App = lazy(() => import("./pages/app"));

export default function Root() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <App />
    </Suspense>
  );
}
