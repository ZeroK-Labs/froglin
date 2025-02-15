import BattleOptionBox from "./BattleOptionBox";
import { FroglinMenuButton } from "./FroglinMenuButton";
import { names } from "frontend/components/FroglinModal";

export default function BattleView({
  selectedFroglin,
  enemyFroglin,
  setChoices,
  choices,
  changeFroglin,
  handleBackButtonClick,
  createBattle,
}: {
  selectedFroglin: number;
  enemyFroglin: number | null;
  setChoices: React.Dispatch<React.SetStateAction<number[]>>;
  choices: number[];
  changeFroglin: (ev: React.MouseEvent) => void;
  handleBackButtonClick: (ev: React.MouseEvent) => void;
  createBattle: () => void;
}) {
  return (
    <div className="flex flex-col">
      <div className="flex flex-row w-full justify-between items-center my-6 relative gap-8">
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

        <div className="z-50 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-10 text-7xl font-bold text-yellow-600">
          VS
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
                Select Oponent
              </div>
              <span>???</span>
            </>
          )}
        </div>
      </div>

      <div className="w-[100px] mx-auto mb-6 text-sm grid grid-cols-3 grid-rows-3">
        <span>🗡️</span>
        <span>beats</span>
        <span>🛡️</span>
        <span>🛡️</span>
        <span>beats</span>
        <span>🏹</span>
        <span>🏹</span>
        <span>beats</span>
        <span>🗡️</span>
      </div>

      <div className="flex flex-row justify-between items-center gap-4 pb-8">
        <div>
          <span className="text-center">Round 1</span>
          <BattleOptionBox
            box={1}
            setChoices={setChoices}
            choices={choices}
            currentOption={choices[0] ?? ""}
          />
        </div>
        <div>
          <span className="text-center">Round 2</span>
          <BattleOptionBox
            box={2}
            setChoices={setChoices}
            choices={choices}
            currentOption={choices[1] ?? ""}
          />
        </div>
        <div>
          <span className="text-center">Round 3</span>
          <BattleOptionBox
            box={3}
            setChoices={setChoices}
            choices={choices}
            currentOption={choices[2] ?? ""}
          />
        </div>
      </div>

      <FroglinMenuButton
        className="bg-gray-900"
        icon="🗡️"
        text="Send to Battle"
        onClick={createBattle}
      />

      <FroglinMenuButton
        className="bg-gray-500 mt-8"
        icon="◀️"
        text="Back to Froglin"
        onClick={handleBackButtonClick}
      />
    </div>
  );
}
