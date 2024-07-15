import { useEffect, useRef } from "react";
import { VIEW } from "settings";

type LeaderBoardState = {
  leaderBoard: boolean;
  setLeaderBoard: React.Dispatch<React.SetStateAction<boolean>>;
};

function LeaderBoard({ leaderBoard, setLeaderBoard }: LeaderBoardState) {
  const divRef = useRef<HTMLDivElement>(null);

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
        className={`fixed left-3 top-[10vh] flex z-[9999] hide-scrollbar overflow-scroll border-4 bg-[#6c5ce7] border-purple-950 transition-all ${leaderBoard ? "" : "invisible"}`}
        style={{
          width: "calc(100% - 1rem)",
          opacity: leaderBoard ? 1 : 0,
          pointerEvents: leaderBoard ? "auto" : "none",
          transitionDuration: `${VIEW.TUTORIAL_FADE_ANIMATION_DURATION}ms`,
        }}
      >
        <h1>LeaderBoard</h1>
      </div>
    </>
  );
}
export default LeaderBoard;
