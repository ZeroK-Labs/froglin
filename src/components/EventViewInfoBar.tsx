import { GameEvent } from "types";
import { TimerIcon } from "components/Icons";
import { CountDownTimer } from "components";

export default function EventViewInfoBar({
  gameEvent,
  capturedCount,
}: {
  gameEvent: GameEvent;
  capturedCount: number;
}) {
  return (
    <>
      <div
        className="absolute top-2 p-2 border-4 flex items-center justify-between bg-[#6c5ce7] text-white border-purple-950"
        style={{ width: "calc(100% - 1rem)" }}
      >
        <div className="flex flex-col w-full">
          <div className="flex justify-center font-bold">Event Stats</div>

          <div className="flex items-center space-x-1 font-semibold">
            Epochs remaining: {gameEvent.epochCount}
          </div>
          <div className="flex items-center space-x-1">
            {/* <TimerIcon className="h-6 w-6" /> */}
            <div className="font-semibold">Epoch duration:</div>
            <span className="pl-1 font-semibold">
              {CountDownTimer(gameEvent.epochDuration / 1000)}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            {/* <TimerIcon className="h-6 w-6" /> */}
            <div className="font-semibold">Event ends in:</div>
            <span className="pl-1 font-semibold">
              {CountDownTimer(
                (gameEvent.epochCount * gameEvent.epochDuration) / 1000,
                false,
              )}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            {/* <TimerIcon className="h-6 w-6" /> */}
            <div className="font-semibold">Captured:</div>
            <span className="pl-1 font-semibold">
              {capturedCount} /{gameEvent.dormantFroglins.length}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
