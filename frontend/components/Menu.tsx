import { useState } from "react";

import { MenuButton } from "frontend/components/MenuButton";
import { MenuPopupList } from "frontend/components/MenuPopupList";

export default function Menu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 left-6">
      <MenuButton
        open={open}
        setOpen={setOpen}
      />
      <MenuPopupList
        open={open}
        setOpen={setOpen}
      />
    </div>
  );
}
