import { useEffect } from "react";

const loadingStyle = {
  color: "#f59e0b",
  animation: "pulse 2000ms linear infinite",
};

export default function LoadingFallback({
  onMount,
  onUnmount,
}: {
  onMount?: any;
  onUnmount?: any;
}) {
  useEffect(
    () => {
      const keyframes = document.createElement("style");
      keyframes.innerText = `@keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.25;
        }
      }`;
      document.head.appendChild(keyframes);

      () => {
        document.head.removeChild(keyframes);
      };
    }, //
    [],
  );

  useEffect(
    () => {
      if (onMount) onMount();

      return () => {
        if (onUnmount) onUnmount();
      };
    }, //
    [onMount, onUnmount],
  );

  return <div style={loadingStyle}>Loading...</div>;
}
