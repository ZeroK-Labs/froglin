import { beforeAll, describe, expect, test } from "bun:test";

import { ACCOUNTS } from "tests/accounts";
import { deploy_contract } from "tests/gateway_contract";
import { stringToBigInt } from "common/utils/bigint";

describe("Concurrent Registration", () => {
  const timeout = 40_000;

  beforeAll(async () => {
    await deploy_contract([ACCOUNTS.alice, ACCOUNTS.bob, ACCOUNTS.charlie]);
  });

  test(
    "multiple accounts can register at the same time",
    async () => {
      const alice = stringToBigInt("alice");
      const bob = stringToBigInt("bob");
      const charlie = stringToBigInt("charlie");

      const promises: Promise<any>[] = [
        ACCOUNTS.alice.contracts.gateway.methods.register(alice).send().wait(),
        ACCOUNTS.bob.contracts.gateway.methods.register(bob).send().wait(),
        ACCOUNTS.charlie.contracts.gateway.methods.register(charlie).send().wait(),
      ];

      await Promise.all(promises);

      const aliceAddr = ACCOUNTS.alice.wallet.getAddress();
      const bobAddr = ACCOUNTS.bob.wallet.getAddress();
      const charlieAddr = ACCOUNTS.charlie.wallet.getAddress();

      expect(
        ACCOUNTS.alice.contracts.gateway.methods.view_name(aliceAddr).simulate(),
      ).resolves.toBe(alice);
      expect(
        ACCOUNTS.bob.contracts.gateway.methods.view_name(bobAddr).simulate(),
      ).resolves.toBe(bob);
      expect(
        ACCOUNTS.charlie.contracts.gateway.methods.view_name(charlieAddr).simulate(),
      ).resolves.toBe(charlie);
    },
    timeout,
  );

  test(
    "multiple accounts can update their name at the same time",
    async () => {
      const alice = stringToBigInt("alice updated");
      const bob = stringToBigInt("bob updated");
      const charlie = stringToBigInt("charlie updated");

      const promises: Promise<any>[] = [
        ACCOUNTS.alice.contracts.gateway.methods.update_name(alice).send().wait(),
        ACCOUNTS.bob.contracts.gateway.methods.update_name(bob).send().wait(),
        ACCOUNTS.charlie.contracts.gateway.methods.update_name(charlie).send().wait(),
      ];

      await Promise.all(promises);

      const aliceAddress = ACCOUNTS.alice.wallet.getAddress();
      const bobAddress = ACCOUNTS.bob.wallet.getAddress();
      const charlieAddress = ACCOUNTS.charlie.wallet.getAddress();

      expect(
        ACCOUNTS.alice.contracts.gateway.methods.view_name(aliceAddress).simulate(),
      ).resolves.toBe(alice);
      expect(
        ACCOUNTS.bob.contracts.gateway.methods.view_name(bobAddress).simulate(),
      ).resolves.toBe(bob);
      expect(
        ACCOUNTS.charlie.contracts.gateway.methods.view_name(charlieAddress).simulate(),
      ).resolves.toBe(charlie);
    },
    timeout,
  );
});
