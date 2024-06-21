// import { TimerIcon } from "components/svg";
import { CountDownTimer } from "components";
import { useGameEventState } from "stores";

export default function EventViewInfoBar({ visible }: { visible: boolean }) {
  const { epochCount, epochDuration, capturedFroglins, interestPoints } =
    useGameEventState();

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
        <div className="flex flex-col w-full">
          <div className="flex justify-center font-bold">Event Stats</div>

          <div className="flex items-center space-x-1 font-semibold">
            Epochs remaining: {epochCount}
          </div>
          <div className="flex items-center space-x-1">
            {/* <TimerIcon className="h-6 w-6" /> */}
            <div className="font-semibold">Epoch duration:</div>
            <span className="pl-1 font-semibold">
              {CountDownTimer(epochDuration / 1000)}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            {/* <TimerIcon className="h-6 w-6" /> */}
            <div className="font-semibold">Event ends in:</div>
            <span className="pl-1 font-semibold">
              {CountDownTimer((epochCount * epochDuration) / 1000, false)}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            {/* <TimerIcon className="h-6 w-6" /> */}
            <div className="font-semibold">Captured: </div>
            <span className="pl-1 font-semibold">
              {capturedFroglins.length} / {interestPoints.length}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
