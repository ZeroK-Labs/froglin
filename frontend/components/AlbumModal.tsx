import { useEffect, useState } from "react";

import { MODALS } from "frontend/enums";
import { Modal } from "frontend/components";
import { useGameEvent, useModalState, usePlayer } from "frontend/stores";

export default function AlbumModal() {
  const [stash, setStash] = useState<number[] | []>(Array(10).fill(0));

  const { modal, setModal } = useModalState();
  const { aztec, registered } = usePlayer();
  const { capturedFroglins } = useGameEvent();

  const visible = modal === MODALS.ALBUM;

  useEffect(() => {
    if (!aztec || !registered) return;
    const playerAddress = aztec?.wallet?.getAddress();
    async function fetchStash() {
      const stash = await aztec?.contracts.gateway.methods
        .view_stash(playerAddress)
        .simulate();
      if (stash.storage.length === 0) {
        return;
      }
      const numberList = stash.storage.map((bi: bigint) => Number(bi));
      setStash(numberList);
    }

    fetchStash();
  }, [aztec, capturedFroglins.length, registered]);

  useEffect(
    () => {
      if (visible) return;

      function handleKeyPress(ev: KeyboardEvent) {
        if (ev.key === "l") setTimeout(setModal, 0, MODALS.ALBUM);
      }

      document.addEventListener("keypress", handleKeyPress);

      return () => {
        document.removeEventListener("keypress", handleKeyPress);
      };
    }, //
    [visible],
  );

  return (
    <Modal
      className="top-20"
      visible={visible}
    >
      <div className="max-h-[500px] flex flex-col">
        <div
          className="px-2 pb-2 mb-2 text-[18px] font-bold border-b justify-items-start items-center text-white"
          style={{ gridTemplateColumns: "min-content auto min-content" }}
        >
          <span className="w-6 mr-4">Album</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {stash.map((count, index) => (
            <div key={index}>
              <div
                className={`relative left-0 top-0 w-fit h-fit p-1 border-[2px] transition-all duration-500 cursor-pointer ${"bg-main-purple border-main-purple-hover border-dashed"}`}
              >
                <img
                  src={`/images/froglin${index + 1}.webp`}
                  width="69px"
                  height="69px"
                  alt="froglin"
                />
                <span className={`absolute item-text text-md -bottom-0.5 right-1`}>
                  {count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
