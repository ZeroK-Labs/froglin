import { Dispatch, SetStateAction } from "react";

import { MODALS } from "src/enums";

type ModalState = {
  modal: MODALS;
  setModal: Dispatch<SetStateAction<MODALS>>;
};

export default ModalState;
