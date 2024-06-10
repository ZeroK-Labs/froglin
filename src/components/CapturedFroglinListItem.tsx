import { Froglin } from "types";

export default function CapturedFroglinListItem({ item }: { item: Froglin }) {
  return (
    <div className="p-2 border-[3px] bg-main-purple border-main-purple-hover border-dashed">
      <img
        src={`/images/froglin${item.type}.png`}
        width="36px"
        height="36px"
        alt=""
      />
    </div>
  );
}
