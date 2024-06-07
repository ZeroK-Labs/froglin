import * as ReactDOM from "react-dom/client";

import "styles/global.css";
import { Home } from "pages/home";
import MapScreen from "components/Map";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  // <Home />,
  <MapScreen />,
);
