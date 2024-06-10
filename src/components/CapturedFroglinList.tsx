import { Froglin } from "types";
import { CapturedFroglinListItem } from "components";

export default function CapturedFroglinList({
  froglins = [],
}: {
  froglins: Froglin[];
}) {
  return (
    <div className="absolute top-20 mx-4 flex flex-row gap-2 flex-wrap">
      {froglins.map((froglin, index) => (
        <CapturedFroglinListItem
          key={index}
          item={froglin}
        />
      ))}
    </div>
  );
}
