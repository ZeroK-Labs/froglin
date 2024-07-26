import fs from "fs";
import { AztecAddress, createPXEClient } from "@aztec/aztec.js";

import { FroglinGatewayContract } from "../aztec/contracts/gateway/artifact/FroglinGateway";
import { createWallet } from "../common/WalletManager";
import { AccountWithContracts } from "../tests/types";

export const BACKEND_WALLET = {
  secret: process.env.BACKEND_WALLET_SECRET!,
  pxe_url: process.env.SANDBOX_URL!,
  contracts: {},
} as AccountWithContracts;

const gateway_address_filepath = "backend/gateway_address";
async function getGatewayContract(): Promise<FroglinGatewayContract> {
  if (fs.existsSync(gateway_address_filepath)) {
    const address_string = fs.readFileSync(gateway_address_filepath, "utf8").trimEnd();
    const address = AztecAddress.fromString(address_string);

    console.log(`Initializing gateway contract @ ${address_string}...`);

    try {
      return await FroglinGatewayContract.at(address, BACKEND_WALLET.wallet);
      //
    } catch (err) {
      console.error(err);
      console.error(`Failed to initialize gateway @ ${address_string}\n`);
    }
  }

  console.log("Deploying gateway contract...");

  const gateway = await FroglinGatewayContract.deploy(BACKEND_WALLET.wallet)
    .send()
    .deployed();

  fs.writeFileSync(gateway_address_filepath, gateway.address.toString(), "utf8");

  return gateway;
}

export async function createAccount() {
  console.log("Creating Aztec account...");

  BACKEND_WALLET.pxe = createPXEClient(BACKEND_WALLET.pxe_url);
  BACKEND_WALLET.wallet = await createWallet(BACKEND_WALLET.secret, BACKEND_WALLET.pxe);
  BACKEND_WALLET.contracts.gateway = await getGatewayContract();
}
