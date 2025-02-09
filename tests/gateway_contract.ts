import { expect } from "bun:test";

import { AccountWithContracts } from "common/types";
import { FroglinGatewayContract } from "aztec/contracts/gateway/artifact/FroglinGateway";
import { GAME_MASTER } from "./accounts";

// deploys a new instance of the gateway contract using the GAME_MASTER's account
// registers the deployed instance with the supplied wallet's PXEs
// re-uses GAME_MASTER's ABI instance to set the accounts' wallet contract instance for method calling
export async function deploy_contract(accounts: AccountWithContracts[]) {
  console.log("Deploying contract...");

  GAME_MASTER.contracts.gateway = await FroglinGatewayContract.deploy(
    GAME_MASTER.wallet,
  )
    .send()
    .deployed();

  expect(GAME_MASTER.contracts.gateway).not.toBeNull();

  console.log(
    `Registering contract \x1b[34m${GAME_MASTER.contracts.gateway.address}\x1b[0m with \x1b[33m${accounts.length}\x1b[0m accounts...`,
  );

  await Promise.all(
    accounts.map((account) => {
      // clone ABI instance from deployed contract
      account.contracts.gateway = GAME_MASTER.contracts.gateway.withWallet(
        account.wallet,
      );

      // register deployed contract in account's PXE
      return account.pxe.registerContract({
        instance: GAME_MASTER.contracts.gateway.instance,
        artifact: GAME_MASTER.contracts.gateway.artifact,
      });
    }),
  );
}
