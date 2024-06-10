import { Froglin } from "types";

export default function CapturedFroglinListItem({ item }: { item: Froglin }) {
  return (
    <div
      className="p-1 border-[2px] bg-main-purple border-dashed"
      style={{ borderColor: "rgba(102, 34, 155, 0.8)" }}
    >
      <img
        src={`/images/froglin${item.type}.png`}
        width="28px"
        height="28px"
        alt=""
      />
    </div>
  );
}
