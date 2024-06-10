import { CountDownTimer, CapturedFroglinList } from "components";
import { BatteryIcon, TimerIcon, MapPinIcon } from "components/Icons";
import { Froglin } from "types";

export default function PlaygroundViewInfoBar({
  secondsLeft,
  distance = 0,
  froglins = [],
}: {
  secondsLeft: number;
  distance: number;
  froglins: Froglin[];
}) {
  return (
    <>
      <div
        className="absolute h-12 p-2 border-4 flex items-center justify-between bg-[#6c5ce7] text-white border-purple-950"
        style={{ width: "calc(100% - 1rem)" }}
      >
        <div className="flex items-center space-x-1">
          <BatteryIcon className="h-6 w-6 text-yellow-300" />
          <span className="font-semibold">20 / 100</span>
        </div>
        <div className="flex items-center space-x-1">
          <TimerIcon className="h-6 w-6" />
          <span className="pl-1 font-semibold">
            {CountDownTimer(secondsLeft)}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="font-semibold">{Math.ceil(distance)} m</span>
          <MapPinIcon className="h-6 w-6" />
        </div>
      </div>
      <CapturedFroglinList froglins={froglins} />
    </>
  );
}
