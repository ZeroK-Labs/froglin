import { Dispatch, SetStateAction, useRef, useState } from "react";

import { LineMenuButton } from "components/LineMenuButton";
import { LineMenuPopupList } from "components/LineMenuPopupList";
import { MAP_VIEWS } from "enums";

type Props = {
  setTutorial: Dispatch<SetStateAction<boolean>>;
  view: MAP_VIEWS;
  setView: Dispatch<SetStateAction<MAP_VIEWS>>;
  setLeaderBoard?: Dispatch<SetStateAction<boolean>>;
};

export default function LineMenu({
  setTutorial,
  view,
  setView,
  setLeaderBoard,
}: Props) {
  const divRef = useRef(null);

  const [open, setOpen] = useState(false);

  return (
    <div
      ref={divRef}
      className="fixed z-[9999] bottom-6 left-6"
    >
      <LineMenuButton
        open={open}
        container={divRef}
        setOpen={setOpen}
      />

      <LineMenuPopupList
        open={open}
        view={view}
        setOpen={setOpen}
        setTutorial={setTutorial}
        setLeaderBoard={setLeaderBoard}
        setView={setView}
      />
    </div>
  );
}
