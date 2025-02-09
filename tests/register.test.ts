import { beforeAll, describe, expect, test } from "bun:test";

import { GAME_MASTER, ACCOUNTS } from "./accounts";
import { deploy_contract } from "./gateway_contract";
import { stringToBigInt } from "common/utils/bigint";
import { test_error } from "./test_error";

describe("Registration", () => {
  const timeout = 40_000;

  beforeAll(async () => {
    console.log("\nSetting up test suite...\n");

    await deploy_contract([ACCOUNTS.alice, ACCOUNTS.bob, ACCOUNTS.charlie]);

    console.log("\nRunning tests...\n");
  });

  test(
    "registers player with expected name",
    async () => {
      const nameAsBigInt = stringToBigInt("alice");

      await ACCOUNTS.alice.contracts.gateway.methods
        .register(nameAsBigInt)
        .send()
        .wait();

      const storedNameAsBigInt = await ACCOUNTS.alice.contracts.gateway.methods
        .view_name(ACCOUNTS.alice.wallet.getAddress())
        .simulate();

      expect(storedNameAsBigInt).toBe(nameAsBigInt);
    },
    timeout,
  );

  test_error(
    "same player tries to register twice",
    () =>
      ACCOUNTS.alice.contracts.gateway.methods
        .register(stringToBigInt("alice"))
        .send()
        .wait(),
    "player is already registered",
  );

  test_error(
    "game master tries to register",
    () =>
      GAME_MASTER.contracts.gateway.methods
        .register(stringToBigInt("I can't play :("))
        .send()
        .wait(),
    "game master cannot register as player",
  );

  test_error(
    "an un-registered account tries to read its name",
    () =>
      ACCOUNTS.bob.contracts.gateway.methods
        .view_name(ACCOUNTS.bob.wallet.getAddress())
        .simulate(),
    "only registered players can call this method",
  );

  test_error(
    "an un-registered account tries to read the name of a registered account",
    () =>
      ACCOUNTS.bob.contracts.gateway.methods
        .view_name(ACCOUNTS.alice.wallet.getAddress())
        .simulate(),
    "Attempted to read past end of BoundedVec",
  );

  test_error(
    "a registered account tries to read the name of an un-registered account",
    () =>
      ACCOUNTS.alice.contracts.gateway.methods
        .view_name(ACCOUNTS.bob.wallet.getAddress())
        .simulate(),
    "only registered players can call this method",
  );

  test_error(
    "a registered account tries to read the name of a different registered account",
    async () => {
      await ACCOUNTS.charlie.contracts.gateway.methods
        .register(stringToBigInt("charlie"))
        .send()
        .wait();
      return ACCOUNTS.charlie.contracts.gateway.methods
        .view_name(ACCOUNTS.alice.wallet.getAddress())
        .simulate();
    },
    "Attempted to read past end of BoundedVec",
  );

  test(
    "updates player with expected name",
    async () => {
      const nameAsBigInt = stringToBigInt("alice in wonderland");

      await ACCOUNTS.alice.contracts.gateway.methods
        .update_name(nameAsBigInt)
        .send()
        .wait();

      const storedNameAsBigInt = await ACCOUNTS.alice.contracts.gateway.methods
        .view_name(ACCOUNTS.alice.wallet.getAddress())
        .simulate();

      expect(storedNameAsBigInt).toBe(nameAsBigInt);
    },
    timeout,
  );

  test_error(
    "an un-registered account tries to update its name in the registry",
    () =>
      ACCOUNTS.bob.contracts.gateway.methods
        .update_name(stringToBigInt("bob in wonderland"))
        .send()
        .wait(),
    "only registered players can call this method",
  );
});
