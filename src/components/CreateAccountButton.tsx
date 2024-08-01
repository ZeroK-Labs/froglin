import { MODALS } from "enums";
import { VIEW } from "settings";
import { useModalState, usePlayer } from "stores";

export default function CreateAccountButton() {
  const { hasSecret } = usePlayer();
  const { modal, setModal } = useModalState();

  function handleCreateAccountClick(ev: React.MouseEvent) {
    setModal(MODALS.ACCOUNT);
    ev.stopPropagation(); // prevent Modal from closing due to click outside its bounds
  }

  return (
    <div
      className="fixed left-1/2 translate-x-[-50%] bottom-24 transition-opacity"
      style={{
        opacity: modal === MODALS.NONE && !hasSecret ? 1 : 0,
        pointerEvents: modal === MODALS.NONE && !hasSecret ? "auto" : "none",
        transitionDuration: `${VIEW.TUTORIAL_FADE_ANIMATION_DURATION}ms`,
      }}
    >
      <button
        type="button"
        className="rounded-md px-4 py-2  text-lg font-semibold shadow-sm text-white bg-indigo-500"
        onClick={handleCreateAccountClick}
      >
        Create Account
      </button>
    </div>
  );
}
