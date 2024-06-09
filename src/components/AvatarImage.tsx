export default function AvatarImage({ size }: { size: string }) {
  return (
    <img
      className="relative self-center rounded-full border-gray-800 border-solid border-2"
      src="/images/profilePic.webp"
      width={size}
      height={size}
      alt=""
    />
  );
}
