import { useEffect } from "react";

import { VIEW } from "settings";

export default function LoadingFallback() {
  useEffect(
    () => {
      return () => {
        const root = document.getElementById("root")! as HTMLDivElement;
        root.style.opacity = "0";

        setTimeout(
          () => {
            root.style.transitionProperty = "opacity";
            root.style.transitionDuration = `${VIEW.MAP_LOAD_ANIMATION_DURATION}ms`;
            root.style.opacity = "1";

            setTimeout(
              () => {
                const loader = document.getElementById("load");
                if (loader) loader.parentElement!.remove();

                const style = document.getElementById("load-style");
                if (style) document.head.removeChild(style);
              }, //
              VIEW.MAP_LOAD_ANIMATION_DURATION,
            );
          }, //
          500,
        );
      };
    }, //
    [],
  );

  return <></>;
  // return <div style={loadingStyle}>Loading...</div>;
}
