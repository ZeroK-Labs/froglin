import { useState, useEffect } from "react";

import { BattleOptionBox, Modal } from "frontend/components";
import { FroglinMenuButton } from "./FroglinMenuButton";
import { MODALS } from "frontend/enums";
import { names } from "frontend/components/FroglinModal";
import { useGameEvent, useModalState } from "frontend/stores";

export default function BattleModal() {
  const [enemyFroglin, setEnemyFroglin] = useState<number | null>(null);
  const [changing, setChanging] = useState(false);

  const { selectedFroglin } = useGameEvent();
  const { modal, setModal } = useModalState();

  const visible = modal === MODALS.BATTLE;

  function changeFroglin(ev: React.MouseEvent) {
    setChanging(true);

    setTimeout(
      () => {
        setChanging(false);

        setEnemyFroglin((prev) => {
          if (prev === null) {
            return selectedFroglin === 0 ? (selectedFroglin + 1) % names.length : 0;
          }
          if (prev + 1 === selectedFroglin) {
            return (prev + 2) % names.length;
          }
          return (prev + 1) % names.length;
        });
      }, //
      300,
    );

    ev.stopPropagation();
  }

  function handleBackButtonClick(ev: React.MouseEvent) {
    setModal(MODALS.FROGLIN);
    ev.stopPropagation();
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
      visible={visible}
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
                  className={`mb-2 transition-opacity duration-500 ${changing ? "opacity-0" : "opacity-100"}`}
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
                  className={`w-[150px] h-[150px] mb-2 border-2 border-white flex items-center justify-center transition-opacity duration-500 ${changing ? "opacity-0" : "opacity-100"}`}
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
            <BattleOptionBox />
          </div>
          <div>
            <span className="text-center">Round 2</span>
            <BattleOptionBox />
          </div>
          <div>
            <span className="text-center">Round 3</span>
            <BattleOptionBox />
          </div>
        </div>

        <FroglinMenuButton
          className="bg-gray-900"
          icon="🗡️"
          text="Send to Battle"
          onClick={() => {}}
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
