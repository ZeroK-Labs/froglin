import { useEffect, useState } from "react";

import { TutorialState } from "types";

export default function useTutorialState(): TutorialState {
  console.log("useTutorialState");

  const [tutorial, setTutorial] = useState(false);

  useEffect(
    () => {
      // show tutorial by default when flag is missing in sessionStorage
      const sessionKeyId = "Froglin:tutorial";
      if (sessionStorage.getItem(sessionKeyId) !== "1") {
        sessionStorage.setItem(sessionKeyId, "1");
        setTimeout(setTutorial, 2_000, true);
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
