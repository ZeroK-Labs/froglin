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
        className="p-2.5 rounded-md hover:bg-main-purple-hover"
        onClick={onClick}
      >
        <div className="text-md whitespace-nowrap">{text}</div>
        <div className="text-4xl">{icon}</div>
      </button>
    </>
  );
}
