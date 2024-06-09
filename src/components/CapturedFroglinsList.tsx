import { Froglin } from "types";
import { CapturedFroglinsListItem } from "components";

export default function CapturedFroglinsList({
  froglins = [],
}: {
  froglins: Froglin[];
}) {
  return (
    <div className="absolute top-20 mx-10 flex flex-row gap-1 hide-scrollbar">
      {froglins.length
        ? froglins.map((froglin, index) => (
            <CapturedFroglinsListItem
              key={index}
              item={froglin}
            />
          ))
        : null}
    </div>
  );
}
