import { useState, useEffect } from "react";
import toast from "react-hot-toast";

import { MODALS } from "frontend/enums";
import { Modal } from "frontend/components";
import { useGameEvent, useModalState, usePlayer } from "frontend/stores";
import { names } from "frontend/components/FroglinModal";

export default function SwapModal() {
  const { selectedFroglin } = useGameEvent();
  const { modal, setModal } = useModalState();
  const { aztec, registered } = usePlayer();
  const [enemyFroglin, setEnemyFroglin] = useState<number | null>(null);

  const visible = modal === MODALS.SWAP;

  useEffect(() => {
    setEnemyFroglin(null);
  }, [modal]);

  function changeFroglin() {
    setEnemyFroglin((prev) => {
      if (prev === null) {
        return selectedFroglin === 0 ? (selectedFroglin + 1) % names.length : 0;
      }
      if (prev + 1 === selectedFroglin) {
        return (prev + 2) % names.length;
      }
      return (prev + 1) % names.length;
    });
  }
  async function createSwapOffer() {
    if (!aztec || !registered) return;
    if (selectedFroglin === null || enemyFroglin === null) return;
    const toastId = toast.loading("Creating swap offer...");
    await aztec.contracts.gateway.methods
      .create_swap_proposal(selectedFroglin, enemyFroglin)
      .send()
      .wait();
    toast.success("Swap offer created!", { id: toastId });
    setModal(MODALS.NONE);
  }

  if (selectedFroglin === null) return null;

  return (
    <Modal
      className="top-4"
      title="Swap"
      visible={visible}
    >
      <div className="max-h-[650px] flex flex-col">
        <div className="flex flex-row w-full justify-between items-center my-6 relative gap-8">
          <div>
            {selectedFroglin !== null ? (
              <img
                src={`/images/froglin${selectedFroglin}-large.webp`}
                width="160px"
                height="160px"
                alt="froglin"
              />
            ) : null}
            <span className="pb-6">
              {selectedFroglin !== null && names[selectedFroglin][0]}
            </span>
          </div>

          <div onClick={changeFroglin}>
            {enemyFroglin !== null ? (
              <img
                src={`/images/froglin${enemyFroglin}-large.webp`}
                width="160px"
                height="160px"
                alt="froglin"
              />
            ) : (
              <>
                <div className="w-[160px] h-[160px] border-2 border-white flex items-center justify-center">
                  Select Froglin to swap for
                </div>
                <span className="py-6 min-h-3">???</span>
              </>
            )}
            <span className="py-6 min-h-3">
              {enemyFroglin !== null ? names[enemyFroglin][0] : ""}
            </span>
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
