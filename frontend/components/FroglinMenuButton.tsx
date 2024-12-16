export function FroglinMenuButton({
  className,
  icon,
  text,
  onClick,
}: {
  className: string;
  icon?: string;
  text: string;
  onClick: React.MouseEventHandler;
}) {
  return (
    <button
      type="button"
      className={`rounded-md px-4 py-2 my-2 text-md font-semibold shadow-sm text-white ${className}`}
      onClick={onClick}
    >
      {icon} {text}
    </button>
  );
}
