import { beforeAll, describe, expect, it } from "bun:test";
import { AccountManager } from "@aztec/aztec.js/account";
import { SingleKeyAccountContract } from "@aztec/accounts/single_key";
import {
  AccountWallet,
  Contract,
  Fr,
  PXE,
  Wallet,
  createPXEClient,
  deriveMasterIncomingViewingSecretKey,
} from "@aztec/aztec.js";

import { FroglinContract } from "contracts/artifacts/Froglin";

describe("Contract Tests", () => {
  const timeout = 40_000;

  let pxe: PXE;
  let account: AccountManager;
  let wallet: AccountWallet;
  let contract: Contract;

  async function call_get_counter(contract: Contract) {
    const counter = await contract.methods
      .get_counter(wallet.getCompleteAddress())
      .simulate();

    return Number(counter);
  }

  beforeAll(async () => {
    pxe = createPXEClient(process.env.PXE_URL!);

    const secretKey = Fr.random();
    const encryptionPrivateKey =
      deriveMasterIncomingViewingSecretKey(secretKey);
    const accountContract = new SingleKeyAccountContract(encryptionPrivateKey);
    account = new AccountManager(pxe, secretKey, accountContract);

    wallet = await account.register();

    contract = await FroglinContract.deploy(
      wallet as any as Wallet,
      wallet.getCompleteAddress().address,
    )
      .send({ contractAddressSalt: Fr.random() })
      .deployed();

    expect(contract).not.toBeNull();
    expect(contract.address).not.toBeNull();
    expect(contract.address.toString().substring(0, 2)).toBe("0x");
  });

  it(
    "get_counter returns 0 after being deployed",
    async () => {
      const counter_value = await call_get_counter(contract);
      expect(counter_value).toBe(0);
    },
    timeout,
  );

  it(
    "get_counter returns expected value after increment",
    async () => {
      await contract.methods
        .increment(wallet.getCompleteAddress())
        .send()
        .wait();

      const counter_value = await call_get_counter(contract);
      expect(counter_value).toBe(1);
    },
    timeout,
  );

  it(
    "get_counter returns expected value after decrement",
    async () => {
      await contract.methods
        .decrement(wallet.getCompleteAddress())
        .send()
        .wait();

      const counter_value = await call_get_counter(contract);
      expect(counter_value).toBe(0);
    },
    timeout,
  );
});
