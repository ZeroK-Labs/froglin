import { Suspense, lazy } from "react";
import { Root, createRoot } from "react-dom/client";

import "styles/global.css";
import { LoadingFallback } from "components";

const App = lazy(() => import("./pages/app"));

const rootElement = document.getElementById("root")! as HTMLDivElement;

function RootComponent() {
  return (
    <Suspense fallback={<LoadingFallback root={rootElement} />}>
      <App />
    </Suspense>
  );
}

if ((module as any).hot) (module as any).hot.accept();

// hydrateRoot(document, <RootComponent />);

// Attach the root to the window object to persist across module reloads
let root: Root = (window as any).__root || null;
if (!root) {
  root = createRoot(rootElement);
  (window as any).__root = root;
}
root.render(<RootComponent />);
