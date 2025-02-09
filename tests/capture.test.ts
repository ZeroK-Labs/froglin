import { assert } from "console";
import { beforeAll, describe, expect, test } from "bun:test";

import { GAME_MASTER, ACCOUNTS } from "./accounts";
import { deploy_contract } from "./gateway_contract";
import { stringToBigInt } from "common/utils/bigint";
import { test_error } from "./test_error";

describe("Capture Froglin", () => {
  const timeout = 40_000;
  const FROGLIN_COUNT = 7;
  const EPOCH_COUNT = 3;
  const EPOCH_DURATION = 20_000;

  beforeAll(async () => {
    console.log("\nSetting up test suite...\n");

    await deploy_contract([ACCOUNTS.alice, ACCOUNTS.bob, ACCOUNTS.charlie]);

    console.log("Registering players...");

    const alice = stringToBigInt("alice");
    const charlie = stringToBigInt("charlie");

    await Promise.all([
      ACCOUNTS.alice.contracts.gateway.methods.register(alice).send().wait(),
      ACCOUNTS.charlie.contracts.gateway.methods.register(charlie).send().wait(),
    ]);

    console.log("\nRunning tests...\n");
  });

  test_error(
    "event is stopped and a registered account tries to capture a Froglin",
    () => ACCOUNTS.alice.contracts.gateway.methods.capture_froglin(0).send().wait(),
    "event is stopped",
  );

  test(
    "registered account can capture a Froglin when the event is started",
    async () => {
      await GAME_MASTER.contracts.gateway.methods
        .start_event(FROGLIN_COUNT, EPOCH_COUNT, EPOCH_DURATION, Date.now())
        .send()
        .wait();

      const froglin_count = Number(
        await GAME_MASTER.contracts.gateway.methods.view_froglin_count().simulate(),
      );

      await ACCOUNTS.alice.contracts.gateway.methods.capture_froglin(0).send().wait();

      const new_froglin_count = Number(
        await GAME_MASTER.contracts.gateway.methods.view_froglin_count().simulate(),
      );
      expect(new_froglin_count).toEqual(froglin_count - 1);

      const stash = await ACCOUNTS.alice.contracts.gateway.methods
        .view_stash(ACCOUNTS.alice.wallet.getAddress())
        .simulate();

      expect(stash[0]).toEqual(1n);
      expect(stash[1]).toEqual(0n);
      expect(stash[2]).toEqual(0n);
      expect(stash[3]).toEqual(0n);
      expect(stash[4]).toEqual(0n);
      expect(stash[5]).toEqual(0n);
      expect(stash[6]).toEqual(0n);
      expect(stash[7]).toEqual(0n);
      expect(stash[8]).toEqual(0n);
      expect(stash[9]).toEqual(0n);
      expect(stash[10]).toEqual(0n);
      expect(stash[11]).toEqual(0n);
    },
    timeout,
  );

  test(
    "registered account can capture a second Froglin of the same type",
    async () => {
      await ACCOUNTS.alice.contracts.gateway.methods.capture_froglin(0).send().wait();

      const stash = await ACCOUNTS.alice.contracts.gateway.methods
        .view_stash(ACCOUNTS.alice.wallet.getAddress())
        .simulate();

      expect(stash[0]).toEqual(2n);
      expect(stash[1]).toEqual(0n);
      expect(stash[2]).toEqual(0n);
      expect(stash[3]).toEqual(0n);
      expect(stash[4]).toEqual(0n);
      expect(stash[5]).toEqual(0n);
      expect(stash[6]).toEqual(0n);
      expect(stash[7]).toEqual(0n);
      expect(stash[8]).toEqual(0n);
      expect(stash[9]).toEqual(0n);
      expect(stash[10]).toEqual(0n);
      expect(stash[11]).toEqual(0n);
    },
    timeout,
  );

  test(
    "registered account can capture different Froglin types",
    async () => {
      await ACCOUNTS.alice.contracts.gateway.methods.capture_froglin(1).send().wait();

      const stash = await ACCOUNTS.alice.contracts.gateway.methods
        .view_stash(ACCOUNTS.alice.wallet.getAddress())
        .simulate();

      expect(stash[0]).toEqual(2n);
      expect(stash[1]).toEqual(1n);
      expect(stash[2]).toEqual(0n);
      expect(stash[3]).toEqual(0n);
      expect(stash[4]).toEqual(0n);
      expect(stash[5]).toEqual(0n);
      expect(stash[6]).toEqual(0n);
      expect(stash[7]).toEqual(0n);
      expect(stash[8]).toEqual(0n);
      expect(stash[9]).toEqual(0n);
      expect(stash[10]).toEqual(0n);
      expect(stash[11]).toEqual(0n);
    },
    timeout,
  );

  test(
    "registered account can capture different Froglin types (2nd stash begining)",
    async () => {
      await ACCOUNTS.alice.contracts.gateway.methods.capture_froglin(8).send().wait();

      const stash = await ACCOUNTS.alice.contracts.gateway.methods
        .view_stash(ACCOUNTS.alice.wallet.getAddress())
        .simulate();

      expect(stash[0]).toEqual(2n);
      expect(stash[1]).toEqual(1n);
      expect(stash[2]).toEqual(0n);
      expect(stash[3]).toEqual(0n);
      expect(stash[4]).toEqual(0n);
      expect(stash[5]).toEqual(0n);
      expect(stash[6]).toEqual(0n);
      expect(stash[7]).toEqual(0n);
      expect(stash[8]).toEqual(1n);
      expect(stash[9]).toEqual(0n);
      expect(stash[10]).toEqual(0n);
      expect(stash[11]).toEqual(0n);
    },
    timeout,
  );

  test(
    "registered account can capture different Froglin types (2nd stash end)",
    async () => {
      await ACCOUNTS.alice.contracts.gateway.methods.capture_froglin(11).send().wait();

      const stash = await ACCOUNTS.alice.contracts.gateway.methods
        .view_stash(ACCOUNTS.alice.wallet.getAddress())
        .simulate();

      expect(stash[0]).toEqual(2n);
      expect(stash[1]).toEqual(1n);
      expect(stash[2]).toEqual(0n);
      expect(stash[3]).toEqual(0n);
      expect(stash[4]).toEqual(0n);
      expect(stash[5]).toEqual(0n);
      expect(stash[6]).toEqual(0n);
      expect(stash[7]).toEqual(0n);
      expect(stash[8]).toEqual(1n);
      expect(stash[9]).toEqual(0n);
      expect(stash[10]).toEqual(0n);
      expect(stash[11]).toEqual(1n);
    },
    timeout,
  );

  test(
    "a different registered account can capture a Froglin when the event is started",
    async () => {
      await ACCOUNTS.charlie.contracts.gateway.methods.capture_froglin(0).send().wait();

      const stash = await ACCOUNTS.charlie.contracts.gateway.methods
        .view_stash(ACCOUNTS.charlie.wallet.getAddress())
        .simulate();

      expect(stash[0]).toEqual(1n);
      expect(stash[1]).toEqual(0n);
      expect(stash[2]).toEqual(0n);
      expect(stash[3]).toEqual(0n);
      expect(stash[4]).toEqual(0n);
      expect(stash[5]).toEqual(0n);
      expect(stash[6]).toEqual(0n);
      expect(stash[7]).toEqual(0n);
      expect(stash[8]).toEqual(0n);
      expect(stash[9]).toEqual(0n);
      expect(stash[10]).toEqual(0n);
      expect(stash[11]).toEqual(0n);
    },
    timeout,
  );

  test_error(
    "a registered account tries to capture a Froglin with of an unknown type",
    () => ACCOUNTS.alice.contracts.gateway.methods.capture_froglin(99).send().wait(),
    "tried to capture an unknown Froglin type",
  );

  test_error(
    "an un-registered account tries to capture a Froglin",
    () => ACCOUNTS.bob.contracts.gateway.methods.capture_froglin(0).send().wait(),
    "only registered players can call this method",
  );

  test_error(
    "an un-registered account tries view its stash",
    () =>
      ACCOUNTS.bob.contracts.gateway.methods
        .view_stash(ACCOUNTS.bob.wallet.getAddress())
        .simulate(),
    "only registered players can call this method",
  );

  test_error(
    "a registered account tries to view the stash of a different registered account",
    () =>
      ACCOUNTS.charlie.contracts.gateway.methods
        .view_stash(ACCOUNTS.alice.wallet.getAddress())
        .simulate(),
    "Attempted to read past end of BoundedVec",
  );

  test_error(
    "a registered account tries to view the stash of an un-registered account",
    () =>
      ACCOUNTS.alice.contracts.gateway.methods
        .view_stash(ACCOUNTS.bob.wallet.getAddress())
        .simulate(),
    "only registered players can call this method",
  );

  test_error(
    "all available Froglins are captured and registered account tries to capture a Froglin",
    async () => {
      const froglin_count = Number(
        await GAME_MASTER.contracts.gateway.methods.view_froglin_count().simulate(),
      );
      assert(
        froglin_count === 1,
        `expected froglin_count to be 1, found ${froglin_count}`,
      );
      await ACCOUNTS.alice.contracts.gateway.methods.capture_froglin(0).send().wait();

      return ACCOUNTS.alice.contracts.gateway.methods.capture_froglin(0).send().wait();
    },
    "all available Froglins have been captured",
  );
});
