import { Dispatch, SetStateAction, useState } from "react";

import { Froglin } from "src/types";

export default function CapturedFroglinListItem({
  item,
  updateSetActiveDispatcher,
}: {
  item: Froglin;
  updateSetActiveDispatcher: (handler: Dispatch<SetStateAction<boolean>>) => void;
}) {
  const [active, setActive] = useState(false);

  function handleClick() {
    setActive((c) => !c);
    updateSetActiveDispatcher(setActive);
  }

  return (
    <div
      onClick={handleClick}
      className={`relative left-0 top-0 w-fit h-fit p-1 border-[2px] transition-all duration-500 cursor-pointer ${
        active
          ? "bg-transparent border-transparent scale-[3] top-8 mx-8 z-[9999]"
          : "bg-main-purple border-main-purple-hover border-dashed"
      }`}
    >
      <img
        src={`/images/froglin${item.type}.png`}
        width="32px"
        height="32px"
        alt=""
      />
    </div>
  );
}
