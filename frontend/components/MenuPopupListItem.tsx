export function MenuPopupListItem({
  text,
  icon,
  onClick,
}: {
  text: string;
  icon: string;
  onClick: React.MouseEventHandler;
}) {
  return (
    <>
      <button
        className="p-4 rounded-md hover:bg-main-purple-hover"
        onClick={onClick}
      >
        <div className="text-lg">{text}</div>
        <div className="text-4xl">{icon}</div>
      </button>
    </>
  );
}
