import { Dispatch, SetStateAction } from "react";

import { MODALS } from "frontend/enums";

type ModalState = {
  modal: MODALS;
  setModal: Dispatch<SetStateAction<MODALS>>;
};

export default ModalState;
