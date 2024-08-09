import type { PXE, AccountWallet } from "@aztec/aztec.js";

type PXEWallet = {
  secret: bigint;
  pxe: PXE;
  pxe_url: string;
  wallet: AccountWallet;
};

export default PXEWallet;
