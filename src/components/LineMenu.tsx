import { Dispatch, SetStateAction, useRef, useState } from "react";

import { LineMenuButton } from "components/LineMenuButton";
import { LineMenuPopupList } from "components/LineMenuPopupList";
import { MAP_VIEWS } from "enums";

type Props = {
  setTutorial: Dispatch<SetStateAction<boolean>>;
  setView: Dispatch<SetStateAction<MAP_VIEWS>>;
};

export default function LineMenu({ setTutorial, setView }: Props) {
  const divRef = useRef(null);

  const [open, setOpen] = useState(false);

  return (
    <div
      ref={divRef}
      className="fixed bottom-6 left-6"
    >
      <LineMenuButton
        open={open}
        container={divRef}
        setOpen={setOpen}
      />

      <LineMenuPopupList
        open={open}
        setOpen={setOpen}
        setTutorial={setTutorial}
        setView={setView}
      />
    </div>
  );
}
