import { Froglin } from "types";

export default function CapturedFroglinListItem({ item }: { item: Froglin }) {
  return (
    <div
      className="p-2 border-[3px] bg-main-purple border-dashed"
      style={{ borderColor: "rgba(102, 34, 155, 0.8)" }}
    >
      <img
        src={`/images/froglin${item.type}.png`}
        width="36px"
        height="36px"
        alt=""
      />
    </div>
  );
}
