export default function CountdownTimer(timeLeft: number) {
  const diffInSeconds = Math.floor(timeLeft / 1000);

  function renderTimeLeft() {
    let minutes = 0,
      seconds = 0;

    if (diffInSeconds > 0) {
      minutes = Math.floor(diffInSeconds / 60);
      seconds = diffInSeconds % 60;
    }

    return `${minutes}m ${seconds}s`;
  }

  return (
    <div className="w-[52px] whitespace-nowrap text-center">
      {renderTimeLeft()}
    </div>
  );
}
