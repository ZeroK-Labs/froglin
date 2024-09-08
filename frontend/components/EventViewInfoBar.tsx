// import { TimerIcon } from "frontend/components/svg";
import { CountDownTimer } from "frontend/components";
import { useGameEvent } from "frontend/stores";

type Props = {
  visible: boolean;
};

export default function EventViewInfoBar({ visible }: Props) {
  const { epochCount, epochDuration, capturedFroglins, interestPoints } =
    useGameEvent();

  return (
    <>
      <div
        className="absolute top-2 p-2 border-4 flex items-center justify-between bg-[#6c5ce7] text-white border-purple-950 transition-opacity duration-1000"
        style={{
          width: "calc(100% - 1rem)",
          opacity: visible ? 1 : 0,
          pointerEvents: "none",
        }}
      >
        <div className="w-full flex flex-col justify-center items-center">
          <div className="mb-4 flex justify-center font-bold">Event Stats</div>

          <div className="flex flex-col">
            <div className="flex items-center space-x-1">
              <div className="ml-0.5">⏳ Epochs remaining:</div>
              <span className="ml-1 font-semibold">{epochCount}</span>
            </div>
            <div className="flex items-center space-x-1">
              <div>⏱️ Epoch duration:</div>
              <span className="ml-1 font-semibold">
                {CountDownTimer(epochDuration / 1000)}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <div>📆 Event ends in:</div>
              <span className="ml-1 font-semibold">
                {CountDownTimer((epochCount * epochDuration) / 1000, false)}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <div>🐸 Captured: </div>
              <span className="ml-1 font-semibold text-gray-800">
                {capturedFroglins.length}{" "}
              </span>
              <span className="font-semibold">/ {interestPoints.length}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
