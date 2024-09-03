import { type AztecAddress } from "@aztec/aztec.js";
import { useEffect, useState } from "react";

import { MODALS } from "frontend/enums";
import { Modal } from "frontend/components";
import { useModalState, usePlayer } from "frontend/stores";

function getPodiumIcon(index: number): string | null {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";

  return null;
}

type LeaderboardEntry = {
  player: AztecAddress;
  score: number;
};

export default function LeaderBoardModal() {
  const [leaderBoardData, setLeaderBoardData] = useState<LeaderboardEntry[]>([]);
  const { aztec, registered } = usePlayer();

  const { modal, setModal } = useModalState();

  const visible = modal === MODALS.LEADERBOARD;

  useEffect(
    () => {
      async function fetchLeaderBoard() {
        if (!aztec || !registered) return;

        const leaderboard = await aztec.contracts.gateway.methods
          .view_leaderboard()
          .simulate();

        if (!leaderboard || leaderboard.length === 0) return;

        setLeaderBoardData(
          leaderboard
            .map((entry: LeaderboardEntry) => {
              entry.score = Number(entry.score);
              return entry;
            })
            .sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.score - a.score),
        );
      }

      fetchLeaderBoard();
    }, //
    [aztec, registered],
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
      <div className="max-w-[500px] max-h-[800px] flex flex-col p-4 overflow-y-scroll">
        <div className="px-2 pb-0.5 text-[14px] font-bold border-b grid grid-cols-6 gap-5 justify-items-start items-center text-white">
          <span className="w-full">Rank</span>
          <span className="col-span-4 mr-4">Player</span>
          <span className="w-full">Captured</span>
        </div>
        {leaderBoardData.map((entry: LeaderboardEntry, index) => (
          <div
            key={index}
            className="p-2 text-sm font-bold grid grid-cols-6 gap-5 justify-items-start items-center text-white"
          >
            <span className="w-full">{getPodiumIcon(index) ?? index + 1}</span>
            <span
              className="w-full col-span-4 overflow-hidden text-ellipsis whitespace-nowrap"
              style={{ maxWidth: "100%" }} // Ensure it fits within the column
            >
              {entry.player.toString()}
            </span>
            <span className="w-full">{entry.score}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}
