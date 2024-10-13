import { MODALS } from "frontend/enums";
import { Modal } from "frontend/components";
import { useGameEvent, useModalState, usePlayer } from "frontend/stores";
import { FroglinMenuButton } from "./FroglinMenuButton";

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

  const visible = modal === MODALS.FROGLIN;
  const disabled = stash[selectedFroglin] === 0;

  function handleModalChange(modal: MODALS, ev: React.MouseEvent) {
    setModal(modal);
    ev.stopPropagation();
  }

  function handleBackButtonClick(ev: React.MouseEvent) {
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
      <div className="flex flex-col">
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

        {disabled ? null : (
          <>
            <FroglinMenuButton
              className="bg-gray-900"
              icon="🗡️"
              text="Send to Battle"
              onClick={handleBattleButtonClick}
            />
            <FroglinMenuButton
              className="bg-blue-800"
              icon="🔄"
              text="Offer to Swap"
              onClick={handleSwapButtonClick}
            />
            <FroglinMenuButton
              className="bg-red-500"
              icon="❤️"
              text="Send on a Date"
              onClick={() => {}}
            />
          </>
        )}

        <FroglinMenuButton
          className="bg-gray-500 mt-8"
          icon="◀️"
          text="Back to Album"
          onClick={handleBackButtonClick}
        />
      </div>
    </Modal>
  );
}
