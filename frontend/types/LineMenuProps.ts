import { Dispatch, SetStateAction } from "react";

type MenuProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

export default MenuProps;
