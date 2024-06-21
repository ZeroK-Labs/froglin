import { Dispatch, SetStateAction, useRef, useState } from "react";

import { LineMenuButton } from "components/LineMenuButton";
import { LineMenuPopupList } from "components/LineMenuPopupList";

type Props = {
  setTutorial: Dispatch<SetStateAction<boolean>>;
};

export default function LineMenu({ setTutorial }: Props) {
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
      />
    </div>
  );
}
