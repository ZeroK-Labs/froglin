type Props = {
  grayscale?: boolean;
  size: string;
};

export default function PlayerMarkerImage({ size, grayscale = false }: Props) {
  return (
    <img
      className={`relative self-center border-2 rounded-full border-gray-800 border-solid ${grayscale ? "filter grayscale-80 brightness-90" : ""}`}
      src="/images/avatar.webp"
      width={size}
      height={size}
      alt=""
    />
  );
}
