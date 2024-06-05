import * as ReactDOM from "react-dom/client";

import "styles/global.css";
import { Home } from "pages/home";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <Home />,
);
