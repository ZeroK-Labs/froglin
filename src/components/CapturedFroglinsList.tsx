import { Froglin } from "types";

export default function CapturedFroglinsList({
  froglins = [],
}: {
  froglins: Froglin[];
}) {
  return (
    <div className="absolute top-20 mx-10 z-10 flex flex-row">
      {froglins.map((froglin, index) => (
        <img
          key={index}
          src={`/images/froglin${froglin.type}.png`}
          width="30"
          height="30"
          alt=""
        />
      ))}
    </div>
  );
}
