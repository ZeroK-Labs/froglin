import { useEffect, useState } from "react";

import { MODALS } from "frontend/enums";
import { Modal } from "frontend/components";
import { useModalState } from "frontend/stores";

export default function AlbumModal() {
  const [stash, setStash] = useState<number[] | []>([]);
  const { modal, setModal } = useModalState();

  const visible = modal === MODALS.ALBUM;

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
      className="top-4"
      visible={visible}
    >
      <div className="max-h-[500px] flex flex-col">
        <div className="max-h-[500px] relative p-4 overflow-y-scroll">
          <div
            className="px-2 pb-2 mb-2 text-[14px] font-bold border-b grid grid-cols-3 gap-5 justify-items-start items-center text-white"
            style={{ gridTemplateColumns: "min-content auto min-content" }}
          >
            <span className="w-6 mr-4">Rank</span>
            <span>Player</span>
            <span>Captured</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {stash.map((count, index) => (
              <div key={index}>tralalala</div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
