import "./styles/global.css";

import { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";

import { LoadingFallback } from "./components";
import { createSocketClient } from "./utils/sockets";

function Root() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <App />
    </Suspense>
  );
}

// WEBPACK HMR

const mod = (module as any) ?? {};
if (mod.hot) mod.hot.accept();

// attach the root to the window object to persist across module reloads
const _window = window as any;
_window.__root ??= createRoot(document.getElementById("root")!);
_window.__root.render(<Root />);

// hydrateRoot(document.getElementById("root")!, <Root />); // SSR

// INITIALIZATION

const App = lazy(() => import("./app"));

createSocketClient();
