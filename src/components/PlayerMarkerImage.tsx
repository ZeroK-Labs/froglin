export default function PlayerMarkerImage({ size }: { size: string }) {
  return (
    <img
      className="relative self-center border-2 rounded-full border-gray-800 border-solid"
      src="/images/avatar.webp"
      width={size}
      height={size}
      alt=""
    />
  );
}
