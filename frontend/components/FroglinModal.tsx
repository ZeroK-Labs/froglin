import { MODALS } from "frontend/enums";
import { Modal } from "frontend/components";
import { useGameEvent, useModalState, usePlayer } from "frontend/stores";

export const names = [
  ["Quagalia", "A froglin that loves to hop around and explore the world."],
  ["Hopsette", "A froglin that loves to hop around and explore the world."],
  ["Jumplina", "Born to jump, this froglin is always on the move."],
  ["Gillywog", "A froglin that loves to hop around and explore the world."],
  ["Swampella", "A froglin that loves to hop around and explore the world."],
  ["Paddlette", "A froglin that loves to hop around and explore the world."],
  ["Croakston", "A froglin that loves to hop around and explore the world."],
  ["Boggart", "Sword fighter jumping from one asteroid to another."],
  ["Mudrick", "A froglin that loves to hop around and explore the world."],
  ["Leapster", "A froglin that loves to hop around and explore the world."],
  ["Fennmarsh", "A froglin that loves to hop around and explore the world."],
  ["Splatter", "A froglin that loves to hop around and explore the world."],
];

export default function FroglinModal() {
  const { selectedFroglin } = useGameEvent();
  const { modal, setModal } = useModalState();
  const { stash } = usePlayer();

  if (selectedFroglin === null) return null;

  const visible = modal === MODALS.FROGLIN_MENU;
  const disabled = stash[selectedFroglin] === 0;

  function handleModalChange(modal: MODALS, ev: React.MouseEvent) {
    setModal(modal);
    ev.stopPropagation();
  }

  function handleAlbumButtonClick(ev: React.MouseEvent) {
    handleModalChange(MODALS.ALBUM, ev);
  }

  function handleBattleButtonClick(ev: React.MouseEvent) {
    handleModalChange(MODALS.BATTLE, ev);
  }

  function handleSwapButtonClick(ev: React.MouseEvent) {
    handleModalChange(MODALS.SWAP, ev);
  }

  return (
    <Modal
      className="top-4"
      icon="🐸"
      title={names[selectedFroglin][0]}
      visible={visible}
    >
      <div className="max-h-[650px] flex flex-col">
        <div className="flex flex-col items-center">
          <img
            className="py-2"
            src={`/images/froglin${selectedFroglin}-large.webp`}
            width="300px"
            height="300px"
            alt="froglin"
          />
          <span className="py-4">{names[selectedFroglin][1]}</span>
        </div>

        <button
          type="button"
          className="rounded-md px-4 py-2 my-2 text-md font-semibold shadow-sm text-white bg-gray-500"
          onClick={handleAlbumButtonClick}
        >
          ◀️ Back to Album
        </button>

        {disabled ? null : (
          <>
            <button
              type="button"
              className="rounded-md px-4 py-2 my-2 text-md font-semibold shadow-sm text-white bg-gray-900"
              onClick={handleBattleButtonClick}
            >
              🗡️ Send to Battle
            </button>

            <button
              type="button"
              className="rounded-md px-4 py-2 my-2 text-md font-semibold shadow-sm text-white bg-blue-800"
              onClick={handleSwapButtonClick}
            >
              🔄 Offer to Swap
            </button>

            <button
              type="button"
              className="rounded-md px-4 py-2 my-2 text-md font-semibold shadow-sm text-white bg-red-500"
              onClick={() => {}}
            >
              ❤️ Send on a Date
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
