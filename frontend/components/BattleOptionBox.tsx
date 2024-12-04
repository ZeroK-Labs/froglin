import { useState } from "react";

const bgcolors = ["bg-blue-400", "bg-green-400", "bg-red-400"];

const iconMapping: { [key: number]: string } = {
  1: "🗡️", // Sword
  2: "🏹", // Bow
  3: "🛡️", // Shield
};

export default function BattleOptionBox({
  box,
  setChoices,
  choices,
  currentOption,
}: {
  box: number;
  setChoices: React.Dispatch<React.SetStateAction<number[]>>;
  choices: number[];
  currentOption: number;
}) {
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [changing, setChanging] = useState(false);

  const options = [1, 2, 3];

  const cycleOption = (direction: "up" | "down") => {
    setChanging(true);

    setTimeout(
      () => {
        setChanging(false);

        const currentIndex = options.indexOf(currentOption);
        const nextIndex =
          direction === "up"
            ? (currentIndex + 1) % options.length
            : (currentIndex - 1 + options.length) % options.length;

        const newOption = options[nextIndex];
        const updatedChoices = [...choices];
        updatedChoices[box - 1] = newOption;
        setChoices(updatedChoices);
      }, //
      150,
    );
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
      className={`
        w-[100px] h-[100px]
        flex items-center justify-center
        text-7xl font-bold
        cursor-pointer select-none
        rounded-lg
        ${currentOption ? bgcolors[options.indexOf(currentOption)] : "bg-gray-400"}
        transition-all duration-300 ease-in-out
      `}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <span
        className={`
        transition-opacity duration-300 ease-in-out
        ${changing ? "opacity-0" : "opacity-100"}
      `}
      >
        {iconMapping[currentOption] ?? ""}
      </span>
    </div>
  );
}
