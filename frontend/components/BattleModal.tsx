import { useState, useEffect } from "react";

import { BattleOptionBox, Modal } from "frontend/components";
import { MODALS } from "frontend/enums";
import { names } from "frontend/components/FroglinModal";
import { useGameEvent, useModalState } from "frontend/stores";

export default function BattleModal() {
  const [enemyFroglin, setEnemyFroglin] = useState<number | null>(null);

  const { selectedFroglin } = useGameEvent();
  const { modal } = useModalState();

  const visible = modal === MODALS.BATTLE;

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
      <div className="max-h-[650px] flex flex-col">
        <div className="flex flex-row w-full justify-between items-center my-6 relative gap-8">
          {selectedFroglin !== null ? (
            <div>
              <img
                src={`/images/froglin${selectedFroglin}-large.webp`}
                width="160px"
                height="160px"
                alt="froglin"
              />
              <span className="pb-6">{names[selectedFroglin][0]}</span>
            </div>
          ) : null}

          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-7xl font-bold text-yellow-600">
            VS
          </div>

          <div onClick={changeFroglin}>
            {enemyFroglin !== null ? (
              <>
                <img
                  src={`/images/froglin${enemyFroglin}-large.webp`}
                  width="160px"
                  height="160px"
                  alt="froglin"
                />
                <span className="pb-6 min-h-3">{names[enemyFroglin][0]}</span>
              </>
            ) : (
              <>
                <div className="w-[160px] h-[160px] border-2 border-white flex items-center justify-center">
                  Select Oponent
                </div>
                <span className="py-6 min-h-3">???</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col mb-6 text-sm">
          <span>🗡️ beats 🛡️</span>
          <span>🛡️ beats 🏹</span>
          <span>🏹 beats 🗡️</span>
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

        <button
          type="button"
          className="rounded-md px-4 py-2 my-2 text-md font-semibold shadow-sm text-white bg-gray-900"
          onClick={() => {}}
        >
          🗡️ Send to battle
        </button>
      </div>
    </Modal>
  );
}
