import { useState } from "react";

import { BurgerButton } from "components/burger-menu/BurgerButton";
import { ButtonsPopup } from "components/burger-menu/ButtonsPopup";
import { MAP_VIEWS } from "enums";

export default function BurgerMenu({
  view,
  setView,
}: {
  view: MAP_VIEWS;
  setView: React.Dispatch<React.SetStateAction<MAP_VIEWS>>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 left-6 z-[9999]">
      <BurgerButton
        open={open}
        setOpen={setOpen}
      />

      <ButtonsPopup
        open={open}
        setOpen={setOpen}
        view={view}
        setView={setView}
      />
    </div>
  );
}
