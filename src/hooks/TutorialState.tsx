import { useEffect, useState } from "react";

import { TutorialState } from "types";

export default function useTutorialState(): TutorialState {
  const [tutorial, setTutorial] = useState(false);

  useEffect(
    () => {
      // show tutorial by default when flag is missing in sessionStorage
      const sessionKeyId = "Froglin:tutorial";
      if (sessionStorage.getItem(sessionKeyId) === "1") return;
      if (localStorage.getItem("user")) return;

      const timerId = setTimeout(() => {
        sessionStorage.setItem(sessionKeyId, "1");
        setTutorial(true);
      }, 2_000);

      return () => {
        clearTimeout(timerId);
      };
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
