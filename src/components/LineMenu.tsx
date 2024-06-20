import { useRef, useState } from "react";

import { LineMenuButton } from "components/LineMenuButton";
import { LineMenuPopupList } from "components/LineMenuPopupList";

export default function LineMenu() {
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
      />
    </div>
  );
}
