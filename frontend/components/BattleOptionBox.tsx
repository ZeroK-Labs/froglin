import { useRef, useState } from "react";

type OptionsEnum = "🗡️" | "🏹" | "🛡️" | "";
const options: OptionsEnum[] = ["🗡️", "🏹", "🛡️"];

const bgcolors = ["bg-blue-400", "bg-green-400", "bg-red-400"];

export default function BattleOptionBox() {
  const boxRef = useRef<HTMLDivElement>(null);

  const [currentOption, setCurrentOption] = useState<OptionsEnum>("");
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isChanging, setIsChanging] = useState(false);

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
