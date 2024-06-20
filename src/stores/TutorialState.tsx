import { useEffect, useState } from "react";

import { StoreFactory } from "stores";
import { TutorialState } from "types";

function createState(): TutorialState {
  console.log("TutorialState createState");

  const [tutorial, setTutorial] = useState(false);

  useEffect(
    () => {
      // show tutorial by default when flag is missing in sessionStorage
      const sessionKeyId = "Froglin:tutorial";
      if (sessionStorage.getItem(sessionKeyId) !== "1") {
        sessionStorage.setItem(sessionKeyId, "1");
        setTutorial(true);
      }
    }, //
    [],
  );

  useEffect(
    () => {
      const handleKeypress = tutorial
        ? () => {
            setTutorial(false);
          }
        : (ev: KeyboardEvent) => {
            if (ev.key === "t") setTutorial(true);
          };

      document.addEventListener("keypress", handleKeypress);

      return () => {
        document.removeEventListener("keypress", handleKeypress);
      };
    }, //
    [tutorial],
  );

  return { tutorial, setTutorial };
}

export const { Provider: TutorialStateProvider, useProvider: useTutorialState } =
  StoreFactory<TutorialState>(createState);
