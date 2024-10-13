import toast from "react-hot-toast";
import React, { useState, useEffect } from "react";

import { MODALS } from "frontend/enums";
import { Modal } from "frontend/components";
import { names } from "frontend/components/FroglinModal";
import { useGameEvent, useModalState, usePlayer } from "frontend/stores";

export default function SwapModal() {
  const [enemyFroglin, setEnemyFroglin] = useState<number | null>(null);

  const { selectedFroglin } = useGameEvent();
  const { modal, setModal } = useModalState();
  const { aztec } = usePlayer();

  const visible = modal === MODALS.SWAP;

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

  async function createSwapOffer() {
    if (!aztec) return;
    if (selectedFroglin === null || enemyFroglin === null) return;

    setModal(MODALS.NONE);

    const toastId = toast.loading("Creating swap offer...");
    await aztec.contracts.gateway.methods
      .create_swap_proposal(selectedFroglin, enemyFroglin)
      .send()
      .wait();
    toast.success("Swap offer created!", { id: toastId });
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
      icon="🔄"
      title="Swap"
      visible={visible}
    >
      <div className="max-h-[650px] flex flex-col">
        <div className="flex flex-row w-full justify-between items-center my-6 relative gap-8">
          <div>
            <img
              src={`/images/froglin${selectedFroglin}-large.webp`}
              width="160px"
              height="160px"
              alt="froglin"
            />
            <span className="pb-6">{names[selectedFroglin][0]}</span>
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
                <div className="w-[160px] h-[160px] p-2 border-2 border-white flex items-center justify-center">
                  Tap here to select a Froglin to swap for
                </div>
                <span className="py-6 min-h-3">???</span>
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          className="rounded-md px-4 py-2 my-2 text-md font-semibold shadow-sm text-white bg-blue-800"
          onClick={createSwapOffer}
        >
          🔄 Create swap offer
        </button>
      </div>
    </Modal>
  );
}
