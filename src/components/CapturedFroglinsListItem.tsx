import { Froglin } from "types";

export default function CapturedFroglinsList({ item }: { item: Froglin }) {
  return (
    <img
      src={`/images/froglin${item.type}.png`}
      width="30px"
      height="30px"
      alt=""
    />
  );
}
