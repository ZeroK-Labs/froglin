import { useEffect, useState } from "react";

import type { LeaderBoardEntry } from "common/types";
import { MODALS } from "frontend/enums";
import { Modal } from "frontend/components";
import { useGameEvent, useModalState, usePlayer } from "frontend/stores";
import {
  addKeyboardShortcut,
  removeKeyboardShortcut,
} from "frontend/utils/KeyboardShortcuts";

function getPodiumIcon(index: number): string | null {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";

  return null;
}

function formatPlayerName(name: string): string {
  return `${name.slice(0, 6)} ... ${name.slice(-4)}`;
}

export default function LeaderBoardModal() {
  const [leaderBoardData, setLeaderBoardData] = useState<LeaderBoardEntry[]>([]);

  const { capturedFroglins } = useGameEvent();
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
            .map((entry: LeaderBoardEntry) => {
              entry.score = Number(entry.score);
              return entry;
            })
            .sort((a: LeaderBoardEntry, b: LeaderBoardEntry) => b.score - a.score)
            .slice(0, 10),
        );
      }

      fetchLeaderBoard();
    }, //
    [aztec, registered, capturedFroglins.length],
  );

  useEffect(
    () => {
      if (visible) return;

      function handleKeyPress(ev: KeyboardEvent) {
        if (ev.key === "l") setTimeout(setModal, 0, MODALS.LEADERBOARD);
      }

      addKeyboardShortcut(handleKeyPress);

      return () => {
        removeKeyboardShortcut(handleKeyPress);
      };
    }, //
    [visible],
  );

  return (
    <Modal
      className="top-4"
      icon="🏆"
      title="Leaderboard"
      visible={visible}
    >
      <div className="max-h-[800px] flex flex-col p-4">
        <div className="px-2 pb-0.5 text-[14px] font-bold border-b grid grid-cols-4 gap-5 justify-items-start items-center text-white">
          <span className="w-full">Rank</span>
          <span className="col-span-2">Player</span>
          <span className="w-full">Captured</span>
        </div>

        {leaderBoardData.map((entry: LeaderBoardEntry, index) => (
          <div
            key={index}
            className="p-2 text-sm font-bold grid grid-cols-4 gap-5 justify-items-start items-center text-white"
          >
            <span className="w-full">{getPodiumIcon(index) ?? index + 1}</span>
            <span
              className="col-span-2 overflow-hidden whitespace-nowrap"
              style={{ maxWidth: "100%" }} // ensure it fits within the column
            >
              {entry.score > 0 ? formatPlayerName(entry.player.toString()) : "-"}
            </span>
            <span className="w-full">{entry.score > 0 ? entry.score : "-"}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}
