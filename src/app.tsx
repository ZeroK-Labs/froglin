import * as ReactDOM from "react-dom/client";

import "styles/global.css";
import { Home } from "pages/home";
import { Map } from "components";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  // <Home />,
  <Map />,
);
