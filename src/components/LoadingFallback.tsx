import { useEffect } from "react";

import { VIEW } from "settings";

export default function LoadingFallback() {
  useEffect(
    () => {
      return () => {
        const root = document.getElementById("root")! as HTMLDivElement;
        const reloaded = root.style.transitionProperty === "opacity";

        root.style.opacity = "0";
        root.style.transitionProperty = "";

        function setVisible() {
          root.style.transitionProperty = "opacity";
          root.style.transitionDuration = `${VIEW.MAP_LOAD_ANIMATION_DURATION}ms`;
          root.style.opacity = "1";
        }

        if (reloaded) {
          setVisible();
          return;
        }

        const duration = 500;
        setTimeout(setVisible, duration);

        // remove loading code
        setTimeout(
          () => {
            const loader = document.getElementById("load");
            if (loader) loader.parentElement!.remove();

            const style = document.getElementById("load-style");
            if (style) document.head.removeChild(style);
          }, //
          VIEW.MAP_LOAD_ANIMATION_DURATION + duration,
        );
      };
    }, //
    [],
  );

  return <></>;
}
