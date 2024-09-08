import { beforeAll, describe, expect, test } from "bun:test";

import { FroglinGatewayContract } from "aztec/contracts/gateway/artifact/FroglinGateway";
import { GAME_MASTER, ACCOUNTS } from "./accounts";
import { stringToBigInt } from "common/utils/bigint";
import { assert } from "console";

describe("Capture Froglin", () => {
  const timeout = 40_000;
  const FROGLIN_COUNT = 5;
  const EPOCH_COUNT = 3;
  const EPOCH_DURATION = 20_000;

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

    console.log("Registering accounts...");

    const alice = stringToBigInt("alice");
    const charlie = stringToBigInt("charlie");

    promises = [
      ACCOUNTS.alice.contracts.gateway.methods.register(alice).send().wait(),
      ACCOUNTS.charlie.contracts.gateway.methods.register(charlie).send().wait(),
    ];

    await Promise.all(promises);
  });

  test(
    "fails when the event is stopped and a registered account tries to capture a Froglin",
    () => {
      expect(
        ACCOUNTS.alice.contracts.gateway.methods.capture_froglin(0).send().wait(),
      ).rejects.toThrow("Assertion failed: event is stopped");
    },
    timeout,
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

  test("fails when a registered account tries to capture a Froglin with of an unknown type", () => {
    expect(
      ACCOUNTS.alice.contracts.gateway.methods.capture_froglin(99).send().wait(),
    ).rejects.toThrow("Assertion failed: tried to capture an unknown Froglin type");
  });

  test("fails when an un-registered account tries to capture a Froglin", () => {
    expect(
      ACCOUNTS.bob.contracts.gateway.methods.capture_froglin(0).send().wait(),
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
    "fails when all available Froglins are captured and registered account tries to capture a Froglin",
    async () => {
      const froglin_count = Number(
        await GAME_MASTER.contracts.gateway.methods.view_froglin_count().simulate(),
      );
      assert(
        froglin_count === 1,
        `expected froglin_count to be 1, found ${froglin_count}`,
      );

      await ACCOUNTS.alice.contracts.gateway.methods.capture_froglin(0).send().wait();

      expect(
        ACCOUNTS.alice.contracts.gateway.methods.capture_froglin(0).send().wait(),
      ).rejects.toThrow("Assertion failed: all available Froglins have been captured");
    },
    timeout,
  );
});
