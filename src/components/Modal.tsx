import { useEffect, useRef } from "react";
import { VIEW } from "settings";

type ModalProps = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  children: React.ReactNode;
  borderColor?: string;
  backgroundColor?: string;
};

function Modal({ isOpen, setIsOpen, children, borderColor = "#000764" }: ModalProps) {
  const divRef = useRef<HTMLDivElement>(null);

  function handleClose(ev: MouseEvent | React.BaseSyntheticEvent) {
    if (
      !(ev.target instanceof HTMLButtonElement) &&
      divRef.current &&
      divRef.current.contains(ev.target as Node)
    ) {
      return;
    }

    setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener("click", handleClose);

    return () => {
      document.removeEventListener("click", handleClose);
    };
  }, [isOpen]);

  return (
    <div
      ref={divRef}
      className={`fixed left-3 p-2 top-[10vh] z-[9999] hide-scrollbar overflow-scroll border-2 bg-[#6c5ce7] transition-all ${isOpen ? "" : "invisible"} `}
      style={{
        width: "calc(100% - 1.5rem)",
        borderColor,
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? "auto" : "none",
        transitionDuration: `${VIEW.TUTORIAL_FADE_ANIMATION_DURATION}ms`,
      }}
    >
      <div className="flex flex-col max-h-[500px] backdrop-blur pointer-events-auto">
        {children}
      </div>
    </div>
  );
}

export default Modal;
