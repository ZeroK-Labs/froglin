import { useEffect } from "react";

import { MODALS } from "frontend/enums";
import { Modal } from "frontend/components";
import { names } from "./FroglinModal";
import { useGameEvent, useModalState, usePlayer } from "frontend/stores";
import {
  addKeyboardShortcut,
  removeKeyboardShortcut,
} from "frontend/utils/KeyboardShortcuts";

export default function AlbumModal() {
  const { capturedFroglins, setSelectedFroglin } = useGameEvent();
  const { modal, setModal } = useModalState();
  const { stash, fetchStash } = usePlayer();

  const visible = modal === MODALS.ALBUM;

  function handleClick(index: number) {
    setSelectedFroglin(index);
    setTimeout(setModal, 0, MODALS.FROGLIN_MENU);
  }

  // handle stash updates
  useEffect(
    () => {
      fetchStash();
    }, //
    [capturedFroglins.length],
  );

  useEffect(
    () => {
      if (visible) {
        fetchStash();

        return;
      }

      function handleKeyPress(ev: KeyboardEvent) {
        if (ev.key === "b") setTimeout(setModal, 0, MODALS.ALBUM);
      }

      addKeyboardShortcut(handleKeyPress);

      return () => {
        removeKeyboardShortcut(handleKeyPress);
      };
    }, //
    [visible],
  );

  return (
    <Modal
      className="top-4"
      icon="📸"
      title="Album"
      visible={visible}
    >
      <div className="max-h-[650px] flex flex-col">
        <div className="mt-3 mb-4 grid grid-cols-3 gap-4">
          {stash.map((count, index) => (
            <div
              key={index}
              onClick={() => handleClick(index)}
            >
              <span>{names[index][0]}</span>
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
