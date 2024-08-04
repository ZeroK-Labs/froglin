export function LineMenuPopupListItem({
  text,
  onClick,
}: {
  text: string;
  onClick: React.MouseEventHandler;
}) {
  return (
    <li>
      <button
        className="p-4 text-4xl hover:bg-main-purple-hover"
        onClick={onClick}
      >
        {text}
      </button>
    </li>
  );
}
