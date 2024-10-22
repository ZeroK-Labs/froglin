import toast from "react-hot-toast";
import { useState, useEffect } from "react";

import { FroglinMenuButton } from "./FroglinMenuButton";
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
    try {
      await aztec.contracts.gateway.methods
        .create_swap_proposal(selectedFroglin, enemyFroglin)
        .send()
        .wait();
    } catch (error) {
      console.error("Error creating swap:", error);
      toast.error("Failed to create swap offer!", { id: toastId });
    }

    toast.success("Swap offer created!", { id: toastId });
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
      icon="🔄"
      title="Swap"
      visible={visible}
    >
      <div className="flex flex-col">
        <div className="relative my-6 flex flex-row w-full justify-between items-center gap-8">
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
                  Tap here to select a Froglin to swap for
                </div>
                <span>???</span>
              </>
            )}
          </div>
        </div>

        <FroglinMenuButton
          className="bg-blue-800"
          icon="🔄"
          text="Create Swap Offer"
          onClick={createSwapOffer}
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
