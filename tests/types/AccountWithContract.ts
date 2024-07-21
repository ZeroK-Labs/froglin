import { PXE, AccountWallet } from "@aztec/aztec.js";

import { FroglinContract } from "../../contracts/artifacts/Froglin";

type AccountWithContract = {
  secret: bigint;
  pxe: PXE;
  pxe_url: string;
  contract: FroglinContract;
  wallet: AccountWallet;
};

export default AccountWithContract;
