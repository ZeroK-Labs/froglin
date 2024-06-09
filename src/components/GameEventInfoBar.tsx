export default function GameEventInfoBar({
  className = "",
}: {
  className: string;
}) {
  return (
    <>
      <div
        className={`flex items-center justify-between bg-[#6c5ce7] text-white px-2 py-2 border-4 border-purple-950 ${className} h-10`}
        style={{ width: "calc(100% - 1rem)" }}
      >
        <div className="flex items-center space-x-1">
          EVENT VIEW COMING HERE
        </div>
      </div>
    </>
  );
}
