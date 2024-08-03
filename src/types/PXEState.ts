import { PXE } from "@aztec/aztec.js";

type PXEState = {
  pxeClient: PXE | null;
  pxeURL: string;
};

export default PXEState;
