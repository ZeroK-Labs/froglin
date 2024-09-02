import { useEffect, useState } from "react";

import { MODALS } from "frontend/enums";
import { Modal } from "frontend/components";
import { useModalState, usePlayer } from "frontend/stores";

function getPodiumIcon(index: number): string {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";

  return "";
}

export default function LeaderBoardModal() {
  const [leaderBoardData, setLeaderBoardData] = useState<number[]>([]);
  const { aztec, username } = usePlayer();

  const { modal, setModal } = useModalState();

  const visible = modal === MODALS.LEADERBOARD;

  useEffect(() => {
    if (!aztec || !username) return;

    async function fetchStash() {
      const stash = await aztec?.contracts.gateway.methods
        .read_leaderboard()
        .simulate();
      if (stash.storage.length === 0) {
        return;
      }
      const numberList = stash.storage
        .map((bi: bigint) => Number(bi))
        .sort((a: number, b: number) => b - a)
        .slice(0, 5);
      setLeaderBoardData(numberList);
    }

    fetchStash();
  }, [aztec, username]);

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

          {leaderBoardData.map((froglins, index) => (
            <div
              key={index}
              className="p-2 font-bold text-sm grid grid-cols-2 gap-5 justify-items-start items-center text-white"
              style={{ gridTemplateColumns: "min-content auto min-content" }}
            >
              <span className="w-6 mr-4">{getPodiumIcon(index) ?? index + 1}</span>
              <span className="whitespace-nowrap">{froglins}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
