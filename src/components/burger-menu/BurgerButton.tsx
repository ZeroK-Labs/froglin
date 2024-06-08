import { useRef, useEffect } from "react";

function BarElement({ mouseOver, css }: { mouseOver: boolean; css: string }) {
  return (
    <div
      className={`h-2 w-full border border-white transition-all duration-300 ease-out bg-${
        mouseOver ? "main-purple" : "gray-800"
      } ${css}`}
    />
  );
}

export function BurgerButton({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const barElementsRef = useRef(document.getElementsByClassName("h-2"));
  const mouseOverRef = useRef(false);

  function handleDocumentClick(ev: MouseEvent) {
    const target = document.getElementsByTagName("nav")[0] as HTMLElement;
    const rect = target.getBoundingClientRect();
    const buttonRect = divRef.current!.getBoundingClientRect();

    const withinBounds =
      (ev.clientX >= rect.left &&
        ev.clientX <= rect.right &&
        ev.clientY >= rect.top &&
        ev.clientY <= rect.bottom) ||
      (ev.clientX >= buttonRect.left &&
        ev.clientX <= buttonRect.right &&
        ev.clientY >= buttonRect.top &&
        ev.clientY <= buttonRect.bottom);

    if (withinBounds) return;

    setOpen(false);
  }

  useEffect(() => {
    if (open) {
      divRef.current!.removeEventListener("click", handleButtonClick);
      document.addEventListener("click", handleDocumentClick);
    }

    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [open]);

  function handleButtonClick(ev: MouseEvent | React.MouseEvent) {
    setOpen(!open);
  }

  function handlePointerMove() {
    mouseOverRef.current = true;

    for (let i = 0; i !== barElementsRef.current.length; ++i) {
      if (barElementsRef.current[i].classList.contains("bg-main-purple")) {
        continue;
      }

      barElementsRef.current[i].classList.add("bg-main-purple");
    }
  }

  function handlePointerLeave() {
    mouseOverRef.current = false;

    for (let i = 0; i !== barElementsRef.current.length; ++i) {
      barElementsRef.current[i].classList.remove("bg-main-purple");
      barElementsRef.current[i].classList.add("bg-gray-800");
    }
  }

  return (
    <div
      ref={divRef}
      className="w-8 h-8 flex flex-col justify-between items-center cursor-pointer"
      onClick={handleButtonClick}
      onMouseMove={handlePointerMove}
      onPointerMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
      onPointerLeave={handlePointerLeave}
    >
      <BarElement
        mouseOver={mouseOverRef.current}
        css={open ? "transform rotate-45 translate-y-2" : ""}
      />
      <BarElement
        mouseOver={mouseOverRef.current}
        css={open ? "opacity-0" : ""}
      />
      <BarElement
        mouseOver={mouseOverRef.current}
        css={open ? "transform -rotate-45 -translate-y-2" : ""}
      />
    </div>
  );
}
