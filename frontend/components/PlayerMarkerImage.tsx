type Props = {
  grayscale?: boolean;
  size: string;
};

export default function PlayerMarkerImage({ size, grayscale = false }: Props) {
  return (
    <img
      className={`inline-block border-2 rounded-full border-solid border-gray-800${grayscale ? " filter grayscale-80 brightness-90" : ""}`}
      src="/images/avatar.webp"
      width={size}
      height={size}
      alt=""
    />
  );
}
