import classNames from "classnames";
import { useState, useEffect } from "react";

const bgcolors = ["bg-blue-400", "bg-green-400", "bg-red-400"];

const iconMapping: { [key: number]: string } = {
  1: "🗡️", // Sword
  2: "🏹", // Bow
  3: "🛡️", // Shield
};
const options = [1, 2, 3];

export default function BattleOptionBox({
  box,
  setChoices,
  choices,
  currentOption,
  isSpinning,
}: {
  box: number;
  setChoices: React.Dispatch<React.SetStateAction<number[]>>;
  choices: number[];
  currentOption: number;
  isSpinning: boolean;
}) {
  const [displayOption, setDisplayOption] = useState<number>(currentOption);

  useEffect(() => {
    let spinInterval: NodeJS.Timer | null = null;

    if (isSpinning) {
      spinInterval = setInterval(() => {
        const randomIdx = Math.floor(Math.random() * options.length);
        setDisplayOption(options[randomIdx]);
      }, 150);
    } else {
      const updatedChoices = [...choices];
      updatedChoices[box - 1] = displayOption;
      setChoices(updatedChoices);
    }

    return () => {
      if (spinInterval) clearInterval(spinInterval);
    };
  }, [isSpinning]);

  const bgClass = displayOption
    ? bgcolors[options.indexOf(displayOption)]
    : "bg-gray-400";

  return (
    <div
      className={classNames(
        "relative w-[100px] h-[100px] rounded-lg flex items-center justify-center",
        "select-none text-7xl font-bold overflow-hidden",
        "transition-all duration-300 ease-in-out",
        bgClass,
        { "animate-slot": isSpinning }, // apply custom slot animation while spinning
      )}
    >
      <span>{iconMapping[displayOption] ?? ""}</span>
    </div>
  );
}
