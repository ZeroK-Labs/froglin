import { createPXEClient } from "@aztec/aztec.js";

import AccountWithContracts from "../common/types/AccountWithContracts";
import { createPXEService, destroyPXEService } from "../common/PXEManager";
import { createWallet } from "../common/WalletManager";

const game_master = { secret: "123", contracts: {} } as AccountWithContracts;

const accounts: { [key: string]: AccountWithContracts } = {
  alice: { secret: "0x123", contracts: {} } as AccountWithContracts,
  bob: { secret: "0x457", contracts: {} } as AccountWithContracts,
  charlie: { secret: "0x789", contracts: {} } as AccountWithContracts,
};

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

export async function createAccounts() {
  if (game_master.wallet !== undefined) return game_master;

  console.log("Creating deployment account...");

  game_master.pxe_url = process.env.SANDBOX_URL!;
  game_master.pxe = createPXEClient(game_master.pxe_url);
  game_master.wallet = await createWallet(game_master.secret, game_master.pxe);

  console.log("Creating player accounts...");

  async function createAccountWallet(account: AccountWithContracts) {
    account.pxe_url = await createPXE();
    account.pxe = createPXEClient(account.pxe_url);
    account.wallet = await createWallet(account.secret, account.pxe);
  }

  let promises: Promise<any>[] = [
    createAccountWallet(accounts.alice),
    createAccountWallet(accounts.bob),
    createAccountWallet(accounts.charlie),
  ];
  await Promise.all(promises);
}

export function destroyAccounts() {
  for (const name in accounts) {
    destroyPXEService(Number(accounts[name].pxe_url.split(":")[2]));
  }
}

export async function getDeploymentAccount(): Promise<AccountWithContracts> {
  if (game_master.wallet !== undefined) await createAccounts();
  return game_master;
}

export async function getPlayerAccount(name: string): Promise<AccountWithContracts> {
  const account = accounts[name];
  if (account.wallet === undefined) await createAccounts();
  return account;
}
