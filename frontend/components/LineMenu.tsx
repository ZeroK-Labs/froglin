import { useState } from "react";

import { LineMenuButton } from "frontend/components/LineMenuButton";
import { LineMenuPopupList } from "frontend/components/LineMenuPopupList";

export default function LineMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 left-6">
      <LineMenuButton
        open={open}
        setOpen={setOpen}
      />
      <LineMenuPopupList
        open={open}
        setOpen={setOpen}
      />
    </div>
  );
}
