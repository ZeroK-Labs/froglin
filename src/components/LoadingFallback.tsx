import { useEffect } from "react";

import { VIEW } from "settings";

type Props = {
  root: HTMLDivElement;
};

const loadingStyle = {
  color: "#f59e0b",
  animation: "pulse 1000ms linear infinite",
};

export default function LoadingFallback({ root }: Props) {
  useEffect(
    () => {
      const keyframes = document.createElement("style");
      keyframes.innerText = `@keyframes pulse {
        0%, 100% { opacity: 0.2; }
        50% { opacity: 1; }
      }`;
      document.head.appendChild(keyframes);

      return () => {
        root.style.opacity = "0";

        setTimeout(
          () => {
            root.style.transitionProperty = "opacity";
            root.style.transitionDuration = `${VIEW.MAP_LOAD_ANIMATION_DURATION}ms`;
            root.style.opacity = "1";

            document.head.removeChild(keyframes);
          }, //
          100,
        );
      };
    }, //
    [],
  );

  return <div style={loadingStyle}>Loading...</div>;
}
