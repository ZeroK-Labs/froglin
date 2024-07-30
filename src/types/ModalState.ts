import { Dispatch, SetStateAction } from "react";

import { MODALS } from "enums";

type ModalState = {
  modal: MODALS;
  setModal: Dispatch<SetStateAction<MODALS>>;
};

export default ModalState;
