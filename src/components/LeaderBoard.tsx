import { useEffect, useRef, useState } from "react";
import { VIEW } from "settings";

type LeaderBoardState = {
  leaderBoard: boolean;
  setLeaderBoard: React.Dispatch<React.SetStateAction<boolean>>;
};

type LeaderBoardData = {
  username: string;
  froglins: number;
};

function LeaderBoard({ leaderBoard, setLeaderBoard }: LeaderBoardState) {
  const divRef = useRef<HTMLDivElement>(null);

  const [leaderBoardData, setLeaderBoardData] = useState<LeaderBoardData[]>([]);

  useEffect(() => {
    async function fetchLeaderBoard() {
      try {
        const response = await fetch("https://localhost:3002/leaderboard");

        const data = await response.json();
        setLeaderBoardData(data);
      } catch (error) {
        console.error("Failed to fetch leaderboard data", error);
      }
    }
    fetchLeaderBoard();
  }, []);

  function handleClose(ev: MouseEvent | React.BaseSyntheticEvent) {
    if (
      !(ev.target instanceof HTMLButtonElement) &&
      divRef.current &&
      divRef.current.contains(ev.target as Node)
    ) {
      return;
    }

    setLeaderBoard(false);
  }

  useEffect(
    () => {
      if (!leaderBoard) return;

      document.addEventListener("click", handleClose);

      return () => {
        document.removeEventListener("click", handleClose);
      };
    }, //
    [leaderBoard],
  );
  return (
    <>
      <div
        ref={divRef}
        className={`fixed left-3 p-2 top-[10vh] z-[9999] hide-scrollbar overflow-scroll border-2 bg-[#6c5ce7] transition-all ${leaderBoard ? "" : "invisible"} `}
        style={{
          width: "calc(100% - 1.5rem)",
          borderColor: "#9c6e3f",
          opacity: leaderBoard ? 1 : 0,
          pointerEvents: leaderBoard ? "auto" : "none",
          transitionDuration: `${VIEW.TUTORIAL_FADE_ANIMATION_DURATION}ms`,
        }}
      >
        <div className="flex flex-col max-h-[500px] backdrop-blur pointer-events-auto">
          <div className="relative p-4 overflow-y-scroll max-h-[500px]">
            <div
              className="grid grid-cols-3 gap-5 justify-items-start items-center px-2 pb-2 mb-2 text-white text-[14px] font-bold border-b"
              style={{ gridTemplateColumns: "min-content auto min-content" }}
            >
              <span className="mr-4 w-6">Rank</span>
              <span>Player</span>
              <span>Captured</span>
            </div>
            {leaderBoardData.map(({ username, froglins }, index) => (
              <div
                key={index}
                className="grid grid-cols-3 gap-5 justify-items-start items-center p-2 font-bold text-white text-sm"
                style={{ gridTemplateColumns: "min-content auto min-content" }}
              >
                <span className="w-6 mr-4">{index + 1}</span>
                <span className="truncate max-w-[150px]">{username}</span>
                <span className="whitespace-nowrap">{froglins}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
export default LeaderBoard;
