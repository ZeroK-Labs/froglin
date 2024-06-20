import { Root, createRoot, hydrateRoot } from "react-dom/client";

import "styles/global.css";
import App from "pages/app";

if ((module as any).hot) (module as any).hot.accept();

// hydrateRoot(document, <App />);

// Attach the root to the window object to persist across module reloads
const rootElement = document.getElementById("root")!;
let root: Root = (window as any).__root || null;
if (!root) {
  root = createRoot(rootElement);
  (window as any).__root = root;
}
root.render(<App />);

//
/////////////// LAZY ////////////////////
//

// import { Root, createRoot } from "react-dom/client";

// import "styles/global.css";
// // import App from "pages/app";
// import(
//   /* webpackMode: "lazy" */
//   /* webpackExports: ["default", "named"] */
//   /* webpackFetchPriority: "high" */
//   "pages/app"
// ).then(({ default: App }) => {
//   const rootElement = document.getElementById("root")!;

//   // Attach the root to the window object to persist across module reloads
//   let root: Root = (window as any).__root || null;

//   if ((module as any).hot) (module as any).hot.accept();

//   if (!root) root = createRoot(rootElement); // hydrateRoot(rootElement, <App />);
//   root.render(<App />);
//   (window as any).__root = root;
// });
