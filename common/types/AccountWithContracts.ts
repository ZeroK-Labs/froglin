import type { PXE, AccountWallet } from "@aztec/aztec.js";

import type { FroglinEventContract } from "contracts/aztec/event/artifact/FroglinEvent";
import type { FroglinGatewayContract } from "contracts/aztec/gateway/artifact/FroglinGateway";

type AccountWithContracts = {
  secret: string;
  pxe: PXE;
  pxe_url: string;
  wallet: AccountWallet;
  contracts: {
    gateway: FroglinGatewayContract;
    event?: FroglinEventContract;
  };
};

export default AccountWithContracts;
