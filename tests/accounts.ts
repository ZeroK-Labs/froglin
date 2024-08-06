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
    console.log("Creating PXE...");

    const [port, pxe] = createPXEService();

    // pxe.stderr!.on("data", (data) => {
    //   process.stderr.write(data);
    // });

    pxe.stdout!.on("data", (data) => {
      // process.stdout.write(data);

      if (!data.includes(`Aztec Server listening on port ${port}`)) return;

      console.log("PXE created successfully!");

      resolve(`http://localhost:${port}`);
    });

    pxe.on("close", (code) => {
      const msg = `PXE process exited with code ${code}`;
      console.log(msg);

      reject(msg);
    });
  });
}

async function createPXEWallet(account: AccountWithContracts) {
  account.pxe_url = await createPXE();
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
