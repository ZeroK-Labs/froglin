export default function CountdownTimer(secondsLeft: number, showSeconds = true) {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="whitespace-nowrap text-center">
      {showSeconds ? `${minutes}m ${seconds}s` : `${minutes}m`}
    </div>
  );
}
