import { useState } from "react";
import { OptionsEnum } from "./BattleModal";

const bgcolors = ["bg-blue-400", "bg-green-400", "bg-red-400"];

export default function BattleOptionBox({
  box,
  setChoices,
  options,
  currentOption,
}: {
  box: number;
  setChoices: React.Dispatch<React.SetStateAction<Record<number, OptionsEnum>>>;
  options: OptionsEnum[];
  currentOption: OptionsEnum;
}) {
  // const [currentOption, setCurrentOption] = useState<OptionsEnum>("");
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [changing, setChanging] = useState(false);

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
        setChoices((prev) => ({
          ...prev,
          [box]: newOption,
        }));
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
        {currentOption ?? ""}
      </span>
    </div>
  );
}
