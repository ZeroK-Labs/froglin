import { useEffect, useState } from "react";
import Modal from "components/Modal";

type LeaderBoardState = {
  leaderBoard: boolean;
  setLeaderBoard: React.Dispatch<React.SetStateAction<boolean>>;
};

type LeaderBoardData = {
  username: string;
  froglins: number;
};

function LeaderBoard({ leaderBoard, setLeaderBoard }: LeaderBoardState) {
  const [leaderBoardData, setLeaderBoardData] = useState<LeaderBoardData[]>([]);

  useEffect(() => {
    async function fetchLeaderBoard() {
      try {
        const response = await fetch(`${process.env.BACKEND_URL}/leaderboard`);

        const data = await response.json();
        setLeaderBoardData(data);
      } catch (error) {
        console.error("Failed to fetch leaderboard data", error);
      }
    }
    fetchLeaderBoard();
  }, []);

  return (
    <>
      <Modal
        isOpen={leaderBoard}
        setIsOpen={setLeaderBoard}
        borderColor="#9c6e3f"
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
      </Modal>
    </>
  );
}
export default LeaderBoard;
