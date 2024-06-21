import { useEffect, useState } from "react";

import { MAP_VIEWS } from "enums";
import { StoreFactory } from "stores";
import { ViewState } from "types";

function createState(): ViewState {
  console.log("ViewState createState");

  const [view, setView] = useState(MAP_VIEWS.PLAYGROUND);

  useEffect(
    () => {
      function handleKeypress(ev: KeyboardEvent) {
        if (ev.key === "1") setView(MAP_VIEWS.PLAYGROUND);
        else if (ev.key === "2") setView(MAP_VIEWS.EVENT);
      }

      document.addEventListener("keypress", handleKeypress);

      return () => {
        document.removeEventListener("keypress", handleKeypress);
      };
    }, //
    [],
  );

  return { view, setView };
}

export const { Provider: ViewStateProvider, useProvider: useViewState } =
  StoreFactory<ViewState>(createState);