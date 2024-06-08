import CountdownTimer from "components/CountDownTimer";

export default function InfoBar({
  countdownTime,
  className = "",
  distance = 0,
}: {
  countdownTime: number;
  className: string;
  distance: number;
}) {
  return (
    <div
      className={`flex items-center justify-between bg-[#6c5ce7] text-white px-2 py-2 border-4 border-purple-950 ${className}`}
      style={{ width: "calc(100% - 1rem)" }}
    >
      <div className="flex items-center space-x-1">
        <BatteryIcon className="h-6 w-6 text-yellow-300" />
        <span className="font-semibold">20 / 100</span>
      </div>
      <div className="flex items-center space-x-1">
        <TimerIcon className="h-6 w-6" />
        <span className="font-semibold">{CountdownTimer(countdownTime)}</span>
      </div>
      <div className="flex items-center space-x-1">
        <MapPinIcon className="h-6 w-6" />
        <span className="font-semibold">{Math.ceil(distance)}m</span>
      </div>
    </div>
  );
}

function BatteryIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        width="16"
        height="10"
        x="2"
        y="7"
        rx="2"
        ry="2"
      />
      <line
        x1="22"
        x2="22"
        y1="11"
        y2="13"
      />
    </svg>
  );
}

function MapPinIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle
        cx="12"
        cy="10"
        r="3"
      />
    </svg>
  );
}

function TimerIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line
        x1="10"
        x2="14"
        y1="2"
        y2="2"
      />
      <line
        x1="12"
        x2="15"
        y1="14"
        y2="11"
      />
      <circle
        cx="12"
        cy="14"
        r="8"
      />
    </svg>
  );
}
