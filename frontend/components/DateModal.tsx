import toast from "react-hot-toast";
import { useState } from "react";

import { SpinOptionBox, Modal } from "frontend/components";
import { FroglinMenuButton } from "./FroglinMenuButton";
import { MODALS } from "frontend/enums";
import { names } from "frontend/components/FroglinModal";
import { useGameEvent, useModalState, usePlayer } from "frontend/stores";

export default function DateModal() {
  const { aztec } = usePlayer();

  const [choices, setChoices] = useState<number[]>([0, 0, 0]);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);

  const { selectedFroglin } = useGameEvent();
  const { modal, setModal } = useModalState();

  const visible = modal === MODALS.DATE;

  function handleSpin() {
    setIsSpinning(true);
    setTimeout(() => {
      setIsSpinning(false);
    }, 3000);
  }

  function handleBackButtonClick(ev: React.MouseEvent) {
    setModal(MODALS.FROGLIN);
    ev.stopPropagation();
  }

  async function createDate() {
    if (!aztec) return;
    if (selectedFroglin === null) {
      toast.error("Select your froglin.");
      return;
    }

    // validate choices
    if (choices.includes(0)) {
      toast.error("Select all 3 moves.");
      return;
    }

    // Transform choices to a single number
    const dateNumber = choices.reduce((acc, choice) => acc * 10 + choice, 0);
    setModal(MODALS.NONE);

    const toastId = toast.loading("Creating date...");
    try {
      await aztec.contracts.gateway.methods
        .create_date_proposal(selectedFroglin, dateNumber)
        .send()
        .wait();
    } catch (error) {
      console.error("Error creating date:", error);
      toast.error("Failed to create date!", { id: toastId });
    }

    toast.success("Date proposal created!", { id: toastId });
  }

  if (selectedFroglin === null) return null;

  return (
    <Modal
      className="top-4"
      icon="❤️"
      title="Date"
      visible={visible}
    >
      <div className="flex flex-col">
        <div className="flex flex-col items-center">
          <img
            className="mb-2 rounded-md"
            src={`/images/froglin${selectedFroglin}-large.webp`}
            width="200px"
            height="2000px"
            alt="froglin"
          />
          <span className="text-xl">{names[selectedFroglin][0]}</span>
        </div>

        <div className="w-[100px] text-lg mx-auto mb-6 grid grid-cols-3 grid-rows-3 border-solid border-2 border-indigo-600">
          <span>🍆</span>
          <span>gets</span>
          <span>💍</span>
          <span>💍</span>
          <span>gets</span>
          <span>❤️</span>
          <span>❤️</span>
          <span>gets</span>
          <span>🍆</span>
        </div>
        <span>Secret combinations will produce an offspring for both</span>

        <div className="flex flex-row justify-between items-center gap-4 pb-8 mt-2">
          <div>
            <span className="text-center">Round 1</span>
            <SpinOptionBox
              box={1}
              setChoices={setChoices}
              currentOption={choices[0] ?? ""}
              isSpinning={isSpinning}
            />
          </div>
          <div>
            <span className="text-center">Round 2</span>
            <SpinOptionBox
              box={2}
              setChoices={setChoices}
              currentOption={choices[1] ?? ""}
              isSpinning={isSpinning}
            />
          </div>
          <div>
            <span className="text-center">Round 3</span>
            <SpinOptionBox
              box={3}
              setChoices={setChoices}
              currentOption={choices[2] ?? ""}
              isSpinning={isSpinning}
            />
          </div>
        </div>

        <FroglinMenuButton
          text="Spin"
          onClick={handleSpin}
          className="mt-4 p-2 bg-blue-500 text-white rounded"
        />

        <FroglinMenuButton
          className="bg-gradient-to-r from-rose-400 via-purple-500 to-pink-500"
          icon="❤️"
          text="Send to a Date"
          onClick={createDate}
        />

        <FroglinMenuButton
          className="bg-gray-500 mt-6"
          icon="◀️"
          text="Back to Froglin"
          onClick={handleBackButtonClick}
        />
      </div>
    </Modal>
  );
}
