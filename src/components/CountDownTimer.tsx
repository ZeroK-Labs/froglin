export default function CountdownTimer(timeLeft: number) {
  const diffInSeconds = Math.ceil(timeLeft / 1000);
  const minutes = Math.floor(diffInSeconds / 60);
  const seconds = diffInSeconds % 60;

  return (
    <div className="w-[52px] whitespace-nowrap text-center">
      {`${minutes}m ${seconds}s`}
    </div>
  );
}
