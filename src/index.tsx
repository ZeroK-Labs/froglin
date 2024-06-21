import { Suspense, useRef } from "react";
import { Root, createRoot } from "react-dom/client";

import "styles/global.css";
import App from "pages/app";
import { VIEW } from "settings";
import { TimeoutId } from "types";
import { LoadingFallback } from "components";

const rootElement = document.getElementById("root")!;

function RootComponent() {
  const timerRef = useRef<TimeoutId>();

  return (
    <Suspense
      fallback={
        <LoadingFallback
          onMount={() => {
            timerRef.current = setTimeout(() => {
              rootElement.style.opacity = "1";
            }, 1_000);
          }}
          onUnmount={() => {
            clearTimeout(timerRef.current);

            rootElement.style.opacity = "0";
            setTimeout(() => {
              rootElement.style.transitionProperty = "opacity";
              rootElement.style.transitionDuration = `${VIEW.MAP_LOAD_ANIMATION_DURATION}ms`;
              rootElement.style.opacity = "1";
            }, 0);
          }}
        />
      }
    >
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
