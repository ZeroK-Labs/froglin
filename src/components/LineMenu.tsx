import { useRef, useState } from "react";

import { LineMenuButton } from "components/LineMenuButton";
import { LineMenuPopupList } from "components/LineMenuPopupList";
import { ModalState, ViewState } from "types";

export default function LineMenu({
  modal,
  setModal,
  view,
  setView,
}: ModalState & ViewState) {
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
        modal={modal}
        setModal={setModal}
        view={view}
        setView={setView}
      />
    </div>
  );
}
