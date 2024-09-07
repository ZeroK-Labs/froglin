import { useEffect, useState } from "react";

import { FROGLIN } from "frontend/settings";
import { MODALS } from "frontend/enums";
import { Modal } from "frontend/components";
import { useGameEvent, useModalState, usePlayer } from "frontend/stores";

const names = [
  "Quagalia",
  "Hopsette",
  "Jumplina",
  "Gillywog",
  "Swampella",
  "Paddlette",
  "Croakston",
  "Boggart",
  "Mudrick",
  "Leapster",
  "Fennmarsh",
  "Splatter",
];

export default function AlbumModal() {
  const [stash, setStash] = useState<number[]>(() => Array(FROGLIN.TYPE_COUNT).fill(0));

  const { modal } = useModalState();
  const { aztec, registered } = usePlayer();
  const { capturedFroglins } = useGameEvent();

  const visible = modal === MODALS.ALBUM;

  useEffect(
    () => {
      async function fetchStash() {
        if (!aztec || !registered) return;

        const playerAddress = aztec.wallet.getAddress();
        const stash = await aztec.contracts.gateway.methods
          .view_stash(playerAddress)
          .simulate();

        if (!stash || stash.length === 0) return;

        setStash(stash);
      }

      fetchStash();
    }, //
    [aztec, registered, capturedFroglins.length],
  );

  // useEffect(
  //   () => {
  //     if (visible) return;

  //     function handleKeyPress(ev: KeyboardEvent) {
  //       if (ev.key === "b") setTimeout(setModal, 0, MODALS.ALBUM);
  //     }

  //     document.addEventListener("keypress", handleKeyPress);

  //     return () => {
  //       document.removeEventListener("keypress", handleKeyPress);
  //     };
  //   }, //
  //   [visible],
  // );

  // say something when the picure is clicked

  return (
    <Modal
      className="top-20"
      visible={visible}
    >
      <div className="max-h-[650px] flex flex-col">
        <div
          className="px-2 pb-2 mb-2 text-[18px] font-bold border-b justify-items-start items-center text-white"
          style={{ gridTemplateColumns: "min-content auto min-content" }}
        >
          <span className="w-6 mr-4">Album</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {stash.map((count, index) => (
            <div key={index}>
              <span>{names[index]}</span>
              <div className="relative left-0 top-0 w-fit h-fit p-1 border-[2px] transition-all duration-500 cursor-pointer bg-main-purple border-main-purple-hover border-dashed">
                <img
                  className={count === 0 ? "grayscale" : ""}
                  src={`/images/froglin${index}.webp`}
                  width="75px"
                  height="75px"
                  alt="froglin"
                />
                <span className="absolute item-text -bottom-0.5 right-1">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
