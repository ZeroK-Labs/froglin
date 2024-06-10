import { useState } from "react";

import { LineMenuButton } from "components/LineMenuButton";
import { LineMenuPopupList } from "components/LineMenuPopupList";
import { MAP_VIEWS } from "enums";

export default function LineMenu({
  view,
  setView,
}: {
  view: MAP_VIEWS;
  setView: React.Dispatch<React.SetStateAction<MAP_VIEWS>>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 left-6 z-[9999]">
      <LineMenuButton
        open={open}
        setOpen={setOpen}
      />

      <LineMenuPopupList
        open={open}
        setOpen={setOpen}
        view={view}
        setView={setView}
      />
    </div>
  );
}
