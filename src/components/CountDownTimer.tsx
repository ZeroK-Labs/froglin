export default function CountdownTimer(secondsLeft: number) {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="whitespace-nowrap text-center">
      {`${minutes}m ${seconds}s`}
    </div>
  );
}
