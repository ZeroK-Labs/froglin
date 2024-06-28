import { useEffect, useRef, useState } from "react";

import { CountDownTimer, CapturedFroglinList } from "components";
import { BatteryIcon, StopwatchIcon, MapPinIcon } from "assets/svg";
import { TimeoutId } from "types";
import { useDemoEventState, useLocation } from "stores";

type Props = {
  visible: boolean;
};

export default function PlaygroundViewInfoBar({ visible }: Props) {
  const epochTickerRef = useRef<TimeoutId>();
  const [secondsLeft, setSecondsLeft] = useState(0);

  const { epochCount, epochDuration, epochStartTime } = useDemoEventState();
  const { metersTravelled } = useLocation();

  useEffect(
    () => {
      if (epochCount === 0 || epochStartTime === 0) return;

      let timeLeft = epochDuration;

      epochTickerRef.current = setInterval(
        () => {
          if (timeLeft === 0) {
            clearInterval(epochTickerRef.current);
            return;
          }

          timeLeft -= 1_000;
          setSecondsLeft(Math.floor(timeLeft * 0.001 + 0.5));
        }, //
        1_000,
      );

      return () => {
        clearInterval(epochTickerRef.current);
      };
    }, //
    [epochStartTime, epochCount],
  );

  return (
    <>
      <div
        className="absolute h-12 p-2 border-4 flex items-center justify-between bg-[#6c5ce7] text-white border-purple-950 transition-opacity duration-1000"
        style={{
          width: "calc(100% - 1rem)",
          opacity: visible ? 1 : 0,
          pointerEvents: "none",
        }}
      >
        <div className="flex items-center space-x-1">
          <BatteryIcon className="h-6 w-6 text-yellow-300" />
          <span className="font-semibold">20 / 100</span>
        </div>
        <div className="flex items-center space-x-1">
          <StopwatchIcon className="h-6 w-6" />
          <span className="pl-1 font-semibold">{CountDownTimer(secondsLeft)}</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="font-semibold">{Math.ceil(metersTravelled)} m</span>
          <MapPinIcon className="h-6 w-6" />
        </div>
      </div>

      <CapturedFroglinList />
    </>
  );
}
