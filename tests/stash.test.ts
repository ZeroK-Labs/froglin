import { beforeAll, describe, expect, test } from "bun:test";

import { FroglinGatewayContract } from "aztec/contracts/gateway/artifact/FroglinGateway";
import { GAME_MASTER, ACCOUNTS } from "./accounts";
import { stringToBigInt } from "common/utils/bigint";
import { assert } from "console";

describe("Stash Tests", () => {
  const timeout = 40_000;
  const FROGLIN_COUNT = 5;
  const EPOCH_COUNT = 2;
  const EPOCH_DURATION = 10_000;

  beforeAll(async () => {
    console.log("Deploying contract...");

    GAME_MASTER.contracts.gateway = await FroglinGatewayContract.deploy(
      GAME_MASTER.wallet,
    )
      .send()
      .deployed();

    expect(GAME_MASTER.contracts.gateway).not.toBeNull();

    // register deployed contract in each PXE
    let promises: Promise<any>[] = [
      ACCOUNTS.alice.pxe.registerContract({
        instance: GAME_MASTER.contracts.gateway.instance,
        artifact: GAME_MASTER.contracts.gateway.artifact,
      }),
      ACCOUNTS.bob.pxe.registerContract({
        instance: GAME_MASTER.contracts.gateway.instance,
        artifact: GAME_MASTER.contracts.gateway.artifact,
      }),
      ACCOUNTS.charlie.pxe.registerContract({
        instance: GAME_MASTER.contracts.gateway.instance,
        artifact: GAME_MASTER.contracts.gateway.artifact,
      }),
    ];
    await Promise.all(promises);

    // create a contract instance per wallet
    ACCOUNTS.alice.contracts.gateway = GAME_MASTER.contracts.gateway.withWallet(
      ACCOUNTS.alice.wallet,
    );
    ACCOUNTS.bob.contracts.gateway = GAME_MASTER.contracts.gateway.withWallet(
      ACCOUNTS.bob.wallet,
    );
    ACCOUNTS.charlie.contracts.gateway = GAME_MASTER.contracts.gateway.withWallet(
      ACCOUNTS.charlie.wallet,
    );
  });

  test(
    "fails when the event is stopped and a registered account tries to capture Froglin",
    async () => {
      await ACCOUNTS.alice.contracts.gateway.methods
        .register(stringToBigInt("alice"))
        .send()
        .wait();

      const froglin_type = 1;
      expect(
        ACCOUNTS.alice.contracts.gateway.methods
          .capture_froglin(froglin_type)
          .send()
          .wait(),
      ).rejects.toThrow("Assertion failed: event is stopped");
    },
    timeout,
  );

  test(
    "registered account can capture Froglin when the event is started",
    async () => {
      await GAME_MASTER.contracts.gateway.methods
        .start_event(FROGLIN_COUNT, EPOCH_COUNT, EPOCH_DURATION, Date.now())
        .send()
        .wait();

      const froglin_count = Number(
        await ACCOUNTS.alice.contracts.gateway.methods.view_froglin_count().simulate(),
      );

      const froglin_type = 1;
      await ACCOUNTS.alice.contracts.gateway.methods
        .capture_froglin(froglin_type)
        .send()
        .wait();

      const stash = await ACCOUNTS.alice.contracts.gateway.methods
        .view_stash(ACCOUNTS.alice.wallet.getAddress())
        .simulate();
      expect(stash.storage[froglin_type]).toEqual(1n);

      const new_froglin_count = Number(
        await ACCOUNTS.alice.contracts.gateway.methods.view_froglin_count().simulate(),
      );
      expect(new_froglin_count).toEqual(froglin_count - 1);
    },
    timeout,
  );

  test(
    "registered account can capture a second Froglin of the same type",
    async () => {
      const froglin_type = 1;
      await ACCOUNTS.alice.contracts.gateway.methods
        .capture_froglin(froglin_type)
        .send()
        .wait();

      const stash = await ACCOUNTS.alice.contracts.gateway.methods
        .view_stash(ACCOUNTS.alice.wallet.getAddress())
        .simulate();
      expect(stash.storage[froglin_type]).toEqual(2n);
    },
    timeout,
  );

  test(
    "registered account can capture different Froglin types",
    async () => {
      const froglin_type = 0;
      await ACCOUNTS.alice.contracts.gateway.methods
        .capture_froglin(froglin_type)
        .send()
        .wait();

      const stash = await ACCOUNTS.alice.contracts.gateway.methods
        .view_stash(ACCOUNTS.alice.wallet.getAddress())
        .simulate();
      expect(stash.storage[froglin_type]).toEqual(1n);
      expect(stash.storage[1]).toEqual(2n);
    },
    timeout,
  );

  test(
    "a different registered account can capture Froglin when the event is started",
    async () => {
      await ACCOUNTS.charlie.contracts.gateway.methods
        .register(stringToBigInt("charlie"))
        .send()
        .wait();

      const froglin_type = 3;
      await ACCOUNTS.charlie.contracts.gateway.methods
        .capture_froglin(froglin_type)
        .send()
        .wait();

      const stash = await ACCOUNTS.charlie.contracts.gateway.methods
        .view_stash(ACCOUNTS.charlie.wallet.getAddress())
        .simulate();
      expect(stash.storage[froglin_type]).toEqual(1n);
    },
    timeout,
  );

  test("fails when a registered account tries to capture Froglin with of an unknown type", () => {
    const froglin_type = 99;
    expect(
      ACCOUNTS.alice.contracts.gateway.methods
        .capture_froglin(froglin_type)
        .send()
        .wait(),
    ).rejects.toThrow("Assertion failed: unknown Froglin type");
  });

  test("fails when an un-registered account tries to capture Froglin", () => {
    const froglin_type = 1;
    expect(
      ACCOUNTS.bob.contracts.gateway.methods
        .capture_froglin(froglin_type)
        .send()
        .wait(),
    ).rejects.toThrow("Assertion failed: only registered players can call this method");
  });

  test("fails when an un-registered account tries view its stash", () => {
    expect(
      ACCOUNTS.bob.contracts.gateway.methods
        .view_stash(ACCOUNTS.bob.wallet.getAddress())
        .simulate(),
    ).rejects.toThrow("Assertion failed: only registered players can call this method");
  });

  test("fails when a registered account tries to view the stash of a different registered account", () => {
    expect(
      ACCOUNTS.charlie.contracts.gateway.methods
        .view_stash(ACCOUNTS.alice.wallet.getAddress())
        .simulate(),
    ).rejects.toThrow("Assertion failed: Attempted to read past end of BoundedVec");
  });

  test("fails when a registered account tries to view the stash of an un-registered account", () => {
    expect(
      ACCOUNTS.alice.contracts.gateway.methods
        .view_stash(ACCOUNTS.bob.wallet.getAddress())
        .simulate(),
    ).rejects.toThrow("Assertion failed: only registered players can call this method");
  });

  test(
    "fails when all available Froglins are captured and registered account tries to capture Froglin",
    async () => {
      const froglin_count = Number(
        await ACCOUNTS.alice.contracts.gateway.methods.view_froglin_count().simulate(),
      );
      assert(
        froglin_count === 1,
        `expected froglin_count to be 1, found ${froglin_count}`,
      );

      const froglin_type = 1;
      await ACCOUNTS.alice.contracts.gateway.methods
        .capture_froglin(froglin_type)
        .send()
        .wait();

      expect(
        ACCOUNTS.alice.contracts.gateway.methods
          .capture_froglin(froglin_type)
          .send()
          .wait(),
      ).rejects.toThrow("Assertion failed: all available Froglins have been captured");
    },
    timeout,
  );
});
