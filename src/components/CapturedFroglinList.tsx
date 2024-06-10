import { Froglin } from "types";
import { CapturedFroglinListItem } from "components";

export default function CapturedFroglinList({
  froglins = [],
}: {
  froglins: Froglin[];
}) {
  return (
    <div className="absolute top-20 mx-10 flex flex-row gap-2 hide-scrollbar">
      {froglins.map((froglin, index) => (
        <CapturedFroglinListItem
          key={index}
          item={froglin}
        />
      ))}
    </div>
  );
}
