import toast from "react-hot-toast";
import { useState, useEffect } from "react";

import { SpinOptionBox, Modal } from "frontend/components";
import { FroglinMenuButton } from "./FroglinMenuButton";
import { MODALS } from "frontend/enums";
import { names } from "frontend/components/FroglinModal";
import { useModalState, usePlayer } from "frontend/stores";

export default function DateModal() {
  const { aztec } = usePlayer();

  const [enemyFroglin, setEnemyFroglin] = useState<number | null>(null);
  const [choices, setChoices] = useState<number[]>([0, 0, 0]);
  const [isSpinning, setIsSpinning] = useState(false);
  // const { selectedFroglin } = useGameEvent();
  const { modal, setModal } = useModalState();
  console.log("modal", modal);
  let selectedFroglin = 1;
  // const visible = modal === MODALS.BATTLE;
  const visible = true;

  function handleSpin() {
    setIsSpinning(true);
    setTimeout(() => {
      setIsSpinning(false);
    }, 1000);
  }

  function changeFroglin(ev: React.MouseEvent) {
    setEnemyFroglin((prev) => {
      if (prev === null) {
        return selectedFroglin === 0 ? (selectedFroglin + 1) % names.length : 0;
      }
      if (prev + 1 === selectedFroglin) {
        return (prev + 2) % names.length;
      }
      return (prev + 1) % names.length;
    });

    ev.stopPropagation();
  }

  function handleBackButtonClick(ev: React.MouseEvent) {
    setModal(MODALS.FROGLIN);
    ev.stopPropagation();
  }

  async function createBattle() {
    if (!aztec) return;
    if (selectedFroglin === null || enemyFroglin === null) {
      toast.error("Select both your froglin and the opponent.");
      return;
    }

    // validate choices
    if (choices.includes(0)) {
      toast.error("Select all 3 moves.");
      return;
    }

    // Transform choices to a single number
    const battleNumber = choices.reduce((acc, choice) => acc * 10 + choice, 0);
    setModal(MODALS.NONE);

    const toastId = toast.loading("Creating batlle...");
    try {
      await aztec.contracts.gateway.methods
        .create_battle_proposal(selectedFroglin, enemyFroglin, battleNumber)
        .send()
        .wait();
    } catch (error) {
      console.error("Error creating batlle:", error);
      toast.error("Failed to create battle!", { id: toastId });
    }

    toast.success("Battle created!", { id: toastId });
  }

  useEffect(
    () => {
      if (visible) setEnemyFroglin(null);
    }, //
    [visible],
  );

  if (selectedFroglin === null) return null;

  return (
    <Modal
      className="top-4"
      icon="🗡️"
      title="Battle"
      visible={true}
    >
      <div className="flex flex-col">
        <div className="flex flex-row w-full justify-between items-center my-6 relative gap-8">
          <div>
            <img
              className="mb-2"
              src={`/images/froglin${selectedFroglin}-large.webp`}
              width="150px"
              height="150px"
              alt="froglin"
            />
            <span>{names[selectedFroglin][0]}</span>
          </div>

          <div className="z-50 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-10 text-7xl font-bold text-yellow-600">
            VS
          </div>

          <div onClick={changeFroglin}>
            {enemyFroglin !== null ? (
              <>
                <img
                  className={`mb-2`}
                  src={`/images/froglin${enemyFroglin}-large.webp`}
                  width="150px"
                  height="150px"
                  alt="froglin"
                />
                <span>{names[enemyFroglin][0]}</span>
              </>
            ) : (
              <>
                <div
                  className={`w-[150px] h-[150px] mb-2 border-2 border-white flex items-center justify-center`}
                >
                  Select Oponent
                </div>
                <span>???</span>
              </>
            )}
          </div>
        </div>

        <div className="w-[100px] mx-auto mb-6 text-sm grid grid-cols-3 grid-rows-3">
          <span>🗡️</span>
          <span>beats</span>
          <span>🛡️</span>
          <span>🛡️</span>
          <span>beats</span>
          <span>🏹</span>
          <span>🏹</span>
          <span>beats</span>
          <span>🗡️</span>
        </div>

        <div className="flex flex-row justify-between items-center gap-4 pb-8">
          <div>
            <span className="text-center">Round 1</span>
            <SpinOptionBox
              box={1}
              setChoices={setChoices}
              choices={choices}
              currentOption={choices[0] ?? ""}
              isSpinning={isSpinning}
            />
          </div>
          <div>
            <span className="text-center">Round 2</span>
            <SpinOptionBox
              box={2}
              setChoices={setChoices}
              choices={choices}
              currentOption={choices[1] ?? ""}
              isSpinning={isSpinning}
            />
          </div>
          <div>
            <span className="text-center">Round 3</span>
            <SpinOptionBox
              box={3}
              setChoices={setChoices}
              choices={choices}
              currentOption={choices[2] ?? ""}
              isSpinning={isSpinning}
            />
          </div>
        </div>

        <button
          onClick={handleSpin}
          className="mt-4 p-2 bg-blue-500 text-white rounded"
        >
          Spin
        </button>

        <FroglinMenuButton
          className="bg-gray-900"
          icon="🗡️"
          text="Send to Battle"
          onClick={createBattle}
        />

        <FroglinMenuButton
          className="bg-gray-500 mt-8"
          icon="◀️"
          text="Back to Froglin"
          onClick={handleBackButtonClick}
        />
      </div>
    </Modal>
  );
}
