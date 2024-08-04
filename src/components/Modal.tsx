import { useEffect, useRef } from "react";

import { MODALS } from "src/enums";
import { VIEW } from "src/settings";
import { useModalState } from "src/stores";

type ModalProps = {
  children: React.ReactNode;
  className?: string;
  icon?: string; // emoji
  title?: string;
  visible?: boolean;
};

export default function Modal({
  children,
  className = "",
  icon = "",
  title = "",
  visible = false,
}: ModalProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { modal, setModal } = useModalState();

  function handleClose(ev: React.MouseEvent | MouseEvent) {
    if (
      ev.target !== buttonRef.current &&
      divRef.current &&
      divRef.current.contains(ev.target as Node)
    ) {
      return;
    }

    setModal(MODALS.NONE);
  }

  // close active Modal on keypress
  useEffect(
    () => {
      if (!visible) return;

      function handleKeyPress() {
        setModal(MODALS.NONE);
      }

      document.addEventListener("click", handleClose);
      if (modal !== MODALS.ACCOUNT) {
        document.addEventListener("keypress", handleKeyPress);
      }

      return () => {
        document.removeEventListener("keypress", handleKeyPress);
        document.removeEventListener("click", handleClose);
      };
    }, //
    [visible],
  );

  return (
    <div
      ref={divRef}
      className={`z-[9999] fixed left-4 right-4 p-2 border-4 rounded-lg flex flex-col items-center text-shadow-default bg-main-purple backdrop-blur-sm border-main-purple-hover ${className}`}
      style={{
        ...(visible
          ? { opacity: 1, pointerEvents: "auto" }
          : { opacity: 0, pointerEvents: "none" }),
        transitionProperty: "opacity",
        transitionDuration: `${VIEW.TUTORIAL_FADE_DURATION}ms`,
        maxHeight: "calc(100dvh - 2rem)",
      }}
    >
      {icon ? <p className="absolute left-2 top-1 text-xl">{icon}</p> : null}
      {title ? <p className="mb-3 text-2xl font-bold justify-center">{title}</p> : null}
      <button
        ref={buttonRef}
        className="absolute right-2.5 top-1 text-xl text-shadow-default hover:text-shadow-hover cursor-pointer fa-solid fa-xmark"
        style={{ transition: "text-shadow 500ms ease" }}
        onClick={handleClose}
      />

      <div
        className="overflow-y-auto hide-scrollbar"
        style={{
          maxHeight: "calc(100dvh - 2rem)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
