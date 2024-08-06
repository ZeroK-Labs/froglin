import { useState } from "react";

import StoreFactory from "./StoreFactory";
import { ModalState } from "frontend/types";
import { MODALS } from "frontend/enums";

function createState(): ModalState {
  const [modal, setModal] = useState(MODALS.NONE);

  return {
    modal,
    setModal,
  };
}

export const { Provider: ModalStateProvider, useProvider: useModalState } =
  StoreFactory<ModalState>(createState);
