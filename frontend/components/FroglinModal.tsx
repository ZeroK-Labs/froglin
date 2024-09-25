import { MODALS } from "frontend/enums";
import { Modal } from "frontend/components";
import { useGameEvent, useModalState } from "frontend/stores";

const names = [
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
  const visible = modal === MODALS.FROGLIN_MENU;

  return (
    <Modal
      className="top-4"
      visible={visible}
    >
      <div className="max-h-[650px] flex flex-col">
        <div className="pb-6">{selectedFroglin && names[selectedFroglin][0]}</div>
        <div>
          <img
            src={`/images/froglin${selectedFroglin}-large.webp`}
            width="300px"
            height="300px"
            alt="froglin"
          />
        </div>
        <div className="pt-6 max-w-[300px]">
          {selectedFroglin && names[selectedFroglin][1]}
        </div>
        <button
          type="button"
          className="rounded-md px-4 py-2 my-2 text-md font-semibold shadow-sm text-white bg-gray-900"
          onClick={() => {
            setModal(MODALS.BATTLE);
          }}
        >
          🗡️ Send to battle
        </button>
        <button
          type="button"
          className="rounded-md px-4 py-2 my-2 text-md font-semibold shadow-sm text-white bg-blue-800"
          onClick={() => {}}
        >
          🔄 Swap
        </button>
        <button
          type="button"
          className="rounded-md px-4 py-2 my-2 text-md font-semibold shadow-sm text-white bg-red-500"
          onClick={() => {}}
        >
          ❤️ Send on a date
        </button>
      </div>
    </Modal>
  );
}
