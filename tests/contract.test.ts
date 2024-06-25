import { beforeAll, describe, expect, it } from "bun:test";
import { AccountManager } from "@aztec/aztec.js/account";
import { SingleKeyAccountContract } from "@aztec/accounts/single_key";
import { NoRetryError } from "@aztec/foundation/retry";
import {
  AccountWallet,
  Fr,
  PXE,
  Wallet,
  createPXEClient,
  deriveMasterIncomingViewingSecretKey,
} from "@aztec/aztec.js";

import { FroglinContract } from "contracts/artifacts/Froglin";

const maxBits = 254; // Noir Field data type is 254 bits wide
const maxBigInt = (1n << BigInt(maxBits)) - 1n; // 2^254 - 1

function stringToBigInt(str: string): bigint {
  let hash = 0n;
  for (let i = 0; i < str.length; i++) {
    const char = BigInt(str.charCodeAt(i));
    hash = (hash << 5n) - hash + char;
    hash &= maxBigInt; // Ensure hash is within 254 bits
  }
  return hash;
}

type SecretKey = number | bigint | boolean | Fr | Buffer;

type AccountWithContract = {
  secretKey: bigint;
  contract: FroglinContract;
  wallet: AccountWallet;
};

async function createWallet(pxe: PXE, secret: SecretKey): Promise<AccountWallet> {
  const secretKey = new Fr(secret);
  const encryptionPrivateKey = deriveMasterIncomingViewingSecretKey(secretKey);
  const contract = new SingleKeyAccountContract(encryptionPrivateKey);
  const manager = new AccountManager(pxe, secretKey, contract);

  const wallet = await manager.register();
  return wallet;
}

describe("Contract Tests", () => {
  const timeout = 40_000;

  let pxe: PXE;
  let alice = {} as AccountWithContract;
  let bob = {} as AccountWithContract;
  let charlie = {} as AccountWithContract;

  beforeAll(async () => {
    pxe = createPXEClient(process.env.PXE_URL!);

    const deploymentAccount = await createWallet(pxe, 123n);

    // initialize contract
    const contract = await FroglinContract.deploy(deploymentAccount as any as Wallet)
      .send({ contractAddressSalt: Fr.random() })
      .deployed();

    expect(contract).not.toBeNull();
    expect(contract.address).not.toBeNull();
    expect(contract.address.toString().substring(0, 2)).toBe("0x");

    // initialize test accounts

    alice.secretKey = 0xabcn;
    alice.wallet = await createWallet(pxe, alice.secretKey);
    alice.contract = contract.withWallet(alice.wallet);

    bob.secretKey = 0xdefn;
    bob.wallet = await createWallet(pxe, bob.secretKey);
    bob.contract = contract.withWallet(bob.wallet);

    charlie.secretKey = 0xabcdefn;
    charlie.wallet = await createWallet(pxe, charlie.secretKey);
    charlie.contract = contract.withWallet(charlie.wallet);
  });

  it(
    "registers player with expected name",
    async () => {
      const nameAsField = stringToBigInt("alice");

      await alice.contract.methods.register(nameAsField).send().wait();

      const viewTxReceipt = await alice.contract.methods
        .view_name(alice.wallet.getCompleteAddress().address)
        .simulate();

      expect(nameAsField).toBe(viewTxReceipt.value);
    },
    timeout,
  );

  it(
    "updates player with expected name",
    async () => {
      const nameAsField = stringToBigInt("alice in wonderland");

      await alice.contract.methods.update_name(nameAsField).send().wait();

      const viewTxReceipt = await alice.contract.methods
        .view_name(alice.wallet.getCompleteAddress().address)
        .simulate();

      expect(nameAsField).toBe(viewTxReceipt.value);
    },
    timeout,
  );

  // it(
  //   "returns expected name when requested get by owner account",
  //   async () => {
  //     const viewTxReceipt = await alice.contract.methods.get_name().send().wait();

  //     console.log(viewTxReceipt);
  //   },
  //   timeout,
  // );

  it(
    "returns expected name when viewed by owner account",
    async () => {
      const nameAsField = stringToBigInt("alice in wonderland");

      const viewTxReceipt = await alice.contract.methods
        .view_name(alice.wallet.getCompleteAddress().address)
        .simulate();

      expect(nameAsField).toBe(viewTxReceipt.value);
    },
    timeout,
  );

  it(
    "fails when an un-registered account tries to read its name",
    async () => {
      try {
        await bob.contract.methods
          .view_name(bob.wallet.getCompleteAddress().address)
          .simulate();
        //
      } catch (error) {
        expect(error).toBeInstanceOf(NoRetryError);
        expect((error as NoRetryError).message).toContain(
          "(JSON-RPC PROPAGATED) Failed to solve brillig function 'self._is_some'",
        );
      }
    },
    timeout,
  );

  it(
    "fails when an un-registered account tries to read the name of another registered account",
    async () => {
      try {
        await bob.contract.methods
          .view_name(alice.wallet.getCompleteAddress().address)
          .simulate();
        //
      } catch (error) {
        expect(error).toBeInstanceOf(NoRetryError);
        expect((error as NoRetryError).message).toContain(
          "(JSON-RPC PROPAGATED) Failed to solve brillig function 'self._is_some'",
        );
      }
    },
    timeout,
  );

  it(
    "fails when a registered account tries to read the name of another registered account",
    async () => {
      try {
        const nameAsField = stringToBigInt("charlie");

        await charlie.contract.methods.register(nameAsField).send().wait();

        await charlie.contract.methods
          .view_name(alice.wallet.getCompleteAddress().address)
          .simulate();
        //
      } catch (error) {
        expect(error).toBeInstanceOf(NoRetryError);
        expect((error as NoRetryError).message).toContain(
          "(JSON-RPC PROPAGATED) Failed to solve brillig function 'self._is_some'",
        );
      }
    },
    timeout,
  );

  it(
    "fails when an un-registered account tries to update its name in the registry",
    async () => {
      try {
        const nameAsField = stringToBigInt("bob in wonderland");

        await bob.contract.methods.update_name(nameAsField).send().wait();
        //
      } catch (error) {
        expect(error).toBeInstanceOf(NoRetryError);
        expect((error as NoRetryError).message).toContain(
          "(JSON-RPC PROPAGATED) Failed to solve brillig function 'self._is_some'",
        );
      }
    },
    timeout,
  );
});
