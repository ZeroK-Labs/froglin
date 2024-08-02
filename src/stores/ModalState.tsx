import { useState } from "react";

import StoreFactory from "./StoreFactory";
import { ModalState } from "src/types";
import { MODALS } from "src/enums";

function createState(): ModalState {
  const [modal, setModal] = useState(MODALS.NONE);

  return {
    modal,
    setModal,
  };
}

export const { Provider: ModalStateProvider, useProvider: useModalState } =
  StoreFactory<ModalState>(createState);
