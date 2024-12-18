import { createPXEClient } from "@aztec/aztec.js";

import AccountWithContracts from "common/types/AccountWithContracts";
import { createPXEService, destroyPXEService } from "common/utils/PXEManager";
import { createWallet } from "common/utils/WalletManager";

export const GAME_MASTER = {
  secret: "123",
  contracts: {},
} as const as AccountWithContracts;

export const ACCOUNTS: { [key: string]: AccountWithContracts } = {
  alice: { secret: "0x123", contracts: {} } as const as AccountWithContracts,
  bob: { secret: "0x457", contracts: {} } as const as AccountWithContracts,
  charlie: { secret: "0x789", contracts: {} } as const as AccountWithContracts,
} as const;

function createPXE(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const [port, _pxe] = createPXEService(
      () => resolve(`http://localhost:${port}`),
      (code) => reject(`PXE process exited with code ${code}`),
    );
  });
}

async function createPXEWallet(account: AccountWithContracts) {
  account.pxe_url = await createPXE(); // GAME_MASTER.pxe_url;
  account.pxe = createPXEClient(account.pxe_url);
  account.wallet = await createWallet(account.secret, account.pxe);
}

export async function createAccounts() {
  console.log("Creating deployment account...");

  GAME_MASTER.pxe_url = process.env.SANDBOX_URL!;
  GAME_MASTER.pxe = createPXEClient(GAME_MASTER.pxe_url);
  GAME_MASTER.wallet = await createWallet(GAME_MASTER.secret, GAME_MASTER.pxe);

  console.log("Creating player accounts...");

  const promises: Promise<any>[] = [
    createPXEWallet(ACCOUNTS.alice),
    createPXEWallet(ACCOUNTS.bob),
    createPXEWallet(ACCOUNTS.charlie),
  ];
  await Promise.all(promises);
}

export function destroyAccounts() {
  for (const name in ACCOUNTS) {
    const port = Number(ACCOUNTS[name].pxe_url.split(":")[2]);
    destroyPXEService(port);
  }
}
