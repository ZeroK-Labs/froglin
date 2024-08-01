import { useEffect, useState } from "react";

import { MODALS } from "enums";
import { Modal } from "components";
import { useModalState } from "stores";

type LeaderBoardData = {
  username: string;
  froglins: number;
};

function getPodiumIcon(index: number): string {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";

  return "";
}

export default function LeaderBoardModal() {
  const [leaderBoardData, setLeaderBoardData] = useState<LeaderBoardData[]>([]);

  const { modal, setModal } = useModalState();

  const visible = modal === MODALS.LEADERBOARD;

  useEffect(
    () => {
      async function fetchLeaderBoard() {
        try {
          const response = await fetch(`${process.env.BACKEND_URL}/leaderboard`);
          const data = await response.json();
          setLeaderBoardData(data);
          //
        } catch (error) {
          console.error("Failed to fetch leaderboard data", error);
        }
      }

      fetchLeaderBoard();
    }, //
    [],
  );

  useEffect(
    () => {
      if (visible) return;

      function handleKeyPress(ev: KeyboardEvent) {
        if (ev.key === "l") setTimeout(setModal, 0, MODALS.LEADERBOARD);
      }

      document.addEventListener("keypress", handleKeyPress);

      return () => {
        document.removeEventListener("keypress", handleKeyPress);
      };
    }, //
    [visible],
  );

  return (
    <Modal
      className="top-4"
      visible={visible}
    >
      <div className="max-h-[500px] flex flex-col">
        <div className="max-h-[500px] relative p-4 overflow-y-scroll">
          <div
            className="px-2 pb-2 mb-2 text-[14px] font-bold border-b grid grid-cols-3 gap-5 justify-items-start items-center text-white"
            style={{ gridTemplateColumns: "min-content auto min-content" }}
          >
            <span className="w-6 mr-4">Rank</span>
            <span>Player</span>
            <span>Captured</span>
          </div>

          {leaderBoardData.map(({ username, froglins }, index) => (
            <div
              key={index}
              className="p-2 font-bold text-sm grid grid-cols-3 gap-5 justify-items-start items-center text-white"
              style={{ gridTemplateColumns: "min-content auto min-content" }}
            >
              <span className="w-6 mr-4">{getPodiumIcon(index) ?? index + 1}</span>
              <span className="max-w-[150px] truncate">{username}</span>
              <span className="whitespace-nowrap">{froglins}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
