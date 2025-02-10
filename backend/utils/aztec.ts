import fs from "fs";
import { AztecAddress, createPXEClient } from "@aztec/aztec.js";

import type { AccountWithContracts } from "common/types";
import { FroglinGatewayContract } from "contracts/aztec/gateway/artifact/FroglinGateway";
import { createWallet } from "common/utils/WalletManager";

export const BACKEND_WALLET = {
  secret: process.env.BACKEND_WALLET_SECRET!,
  pxe_url: process.env.SANDBOX_URL!,
  contracts: {},
} as AccountWithContracts;

const gateway_address_filepath = "backend/gateway_address";

async function deployGatewayContract() {
  console.log("Deploying gateway contract...");

  const gateway = await FroglinGatewayContract.deploy(BACKEND_WALLET.wallet)
    .send()
    .deployed();

  fs.writeFileSync(gateway_address_filepath, gateway.address.toString(), "utf8");

  return gateway;
}

async function getGatewayContract(): Promise<FroglinGatewayContract> {
  if (fs.existsSync(gateway_address_filepath)) {
    const address_string = fs.readFileSync(gateway_address_filepath, "utf8").trimEnd();
    const address = AztecAddress.fromString(address_string);

    console.log(`Initializing gateway contract...`);

    try {
      return await FroglinGatewayContract.at(address, BACKEND_WALLET.wallet);
      //
    } catch (err) {
      if (
        (err as any).toString().includes("has not been registered in the wallet's PXE")
      ) {
        console.error(`Failed to initialize gateway contract @ ${address_string}\n`);
      } //
      else throw err;
    }
  }

  return deployGatewayContract();
}

export async function createAccount() {
  console.log("Creating Aztec account...");

  BACKEND_WALLET.pxe = createPXEClient(BACKEND_WALLET.pxe_url);
  BACKEND_WALLET.wallet = await createWallet(BACKEND_WALLET.secret, BACKEND_WALLET.pxe);
  BACKEND_WALLET.contracts.gateway = await getGatewayContract();
}
