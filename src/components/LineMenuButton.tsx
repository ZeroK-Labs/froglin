import { useRef, useEffect } from "react";

import { LineMenuButtonElement } from "./LineMenuButtonElement";
import { LineMenuProps } from "types";

export function LineMenuButton({ open, setOpen }: LineMenuProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const lineElementsRef = useRef<HTMLCollectionOf<Element>>();
  const mouseOverRef = useRef(false);

  let css1, css2, css3;
  css1 = css2 = css3 = "";
  if (open) {
    css1 = "transform rotate-45 translate-y-2";
    css2 = "opacity-0";
    css3 = "transform -rotate-45 -translate-y-2";
  }

  function handleButtonClick() {
    setOpen(!open);
  }

  function handlePointerMove() {
    mouseOverRef.current = true;
    if (!lineElementsRef.current) return;

    for (let i = 0; i !== lineElementsRef.current.length; ++i) {
      const lineElement = lineElementsRef.current[i];

      if (lineElement.classList.contains("bg-main-purple")) continue;

      lineElement.classList.add("bg-main-purple");
    }
  }

  function handlePointerLeave() {
    mouseOverRef.current = false;
    if (!lineElementsRef.current) return;

    for (let i = 0; i !== lineElementsRef.current.length; ++i) {
      const barElement = lineElementsRef.current[i];

      barElement.classList.remove("bg-main-purple");
      barElement.classList.add("bg-gray-800");
    }
  }

  useEffect(
    () => {
      function handleDocumentClick(ev: MouseEvent) {
        if (divRef.current!.contains(ev.target as Node)) return;

        setOpen(false);
      }

      lineElementsRef.current = document.getElementsByClassName("h-2");
      document.addEventListener("click", handleDocumentClick);

      return () => {
        document.removeEventListener("click", handleDocumentClick);
      };
    }, //
    [],
  );

  return (
    <div
      ref={divRef}
      className="w-8 h-8 flex flex-col justify-between items-center cursor-pointer"
      onClick={handleButtonClick}
      onMouseMove={handlePointerMove}
      onPointerMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
      onPointerLeave={handlePointerLeave}
      onTouchMove={handlePointerMove}
    >
      <LineMenuButtonElement css={css1} />
      <LineMenuButtonElement css={css2} />
      <LineMenuButtonElement css={css3} />
    </div>
  );
}
