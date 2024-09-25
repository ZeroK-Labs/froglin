import React, { useState, useRef, useEffect } from "react";

import { MODALS } from "frontend/enums";
import { Modal } from "frontend/components";
import { useGameEvent, useModalState } from "frontend/stores";

const names = [
  ["Quagalia", "A froglin that loves to hop around and explore the world."],
  ["Hopsette", "A froglin that loves to hop around and explore the world."],
  ["Jumplina", "Born to jump, this froglin is always on the move."],
  ["Gillywog", "A froglin that loves to hop around and explore the world."],
  ["Swampella", "A froglin that loves to hop around and explore the world."],
  ["Paddlette", "A froglin that loves to hop around and explore the world."],
  ["Croakston", "A froglin that loves to hop around and explore the world."],
  ["Boggart", "Sword fighter jumping from one asteroid to another."],
  ["Mudrick", "A froglin that loves to hop around and explore the world."],
  ["Leapster", "A froglin that loves to hop around and explore the world."],
  ["Fennmarsh", "A froglin that loves to hop around and explore the world."],
  ["Splatter", "A froglin that loves to hop around and explore the world."],
];

const options: OptionsEnum[] = ["🗡️", "🏹", "🛡️"];
type OptionsEnum = "🗡️" | "🏹" | "🛡️" | "";

export default function BattleModal() {
  const { selectedFroglin } = useGameEvent();
  const { modal } = useModalState();
  const [enemyFroglin, setEnemyFroglin] = useState<number | null>(null);

  const visible = modal === MODALS.BATTLE;

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

  if (selectedFroglin === null) return null;

  return (
    <Modal
      className="top-4"
      title="Battle"
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
            <span className="pb-6">
              {selectedFroglin !== null && names[selectedFroglin][0]}
            </span>
          </div>
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-7xl font-bold text-yellow-600">
            VS
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
                  Select Oponent
                </div>
                <span className="py-6 min-h-3">???</span>
              </>
            )}
            <span className="py-6 min-h-3">
              {enemyFroglin !== null ? names[enemyFroglin][0] : ""}
            </span>
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
            <LightAnimatedOptionBox />
          </div>
          <div>
            <span className="text-center">Round 2</span>
            <LightAnimatedOptionBox />
          </div>
          <div>
            <span className="text-center">Round 3</span>
            <LightAnimatedOptionBox />
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

function LightAnimatedOptionBox() {
  const [currentOption, setCurrentOption] = useState<OptionsEnum>("");
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isChanging, setIsChanging] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const bgcolors = ["bg-blue-400", "bg-green-400", "bg-red-400"];

  const cycleOption = (direction: "up" | "down") => {
    setIsChanging(true);
    setTimeout(() => {
      setCurrentOption((prev) => {
        if (prev === null) return options[0];
        const currentIndex = options.indexOf(prev);
        if (direction === "up") {
          return options[(currentIndex + 1) % options.length];
        } else {
          return options[(currentIndex - 1 + options.length) % options.length];
        }
      });
      setIsChanging(false);
    }, 150); // Half of the transition duration
  };

  const handleClick = () => {
    cycleOption("up");
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchEndY - touchStartY;

    if (Math.abs(deltaY) > 10) {
      cycleOption(deltaY > 0 ? "down" : "up");
    }
    setTouchStartY(null);
  };

  return (
    <div
      ref={boxRef}
      className={`
        w-[100px] h-[100px]
        flex items-center justify-center
        text-7xl font-bold
        cursor-pointer select-none
        rounded-lg
        ${currentOption ? bgcolors[options.indexOf(currentOption)] : "bg-gray-400"}
        transition-all duration-300 ease-in-out
        active:scale-95
      `}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <span
        className={`
        transition-opacity duration-300 ease-in-out
        ${isChanging ? "opacity-0" : "opacity-100"}
      `}
      >
        {currentOption ?? ""}
      </span>
    </div>
  );
}
