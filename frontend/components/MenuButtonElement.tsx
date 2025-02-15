export function MenuButtonElement({ css }: { css: string }) {
  return (
    <div
      className={`h-2 w-full border border-white transition-all duration-300 ease-out bg-gray-800 hover:bg-main-purple-hover"
      } ${css}`}
    />
  );
}
