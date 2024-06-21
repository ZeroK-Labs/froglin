import { createRoot } from "react-dom/client";

import "styles/global.css";
import Root from "./root";

if ((module as any).hot) (module as any).hot.accept();

// hydrateRoot(document.getElementById("root")!, <Root />);

// Attach the root to the window object to persist across module reloads
const _window = window as any;
_window.__root ??= createRoot(document.getElementById("root")!);
_window.__root.render(<Root />);
