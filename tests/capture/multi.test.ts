import { beforeAll, describe, expect, test } from "bun:test";

import { FroglinGatewayContract } from "aztec/contracts/gateway/artifact/FroglinGateway";
import { GAME_MASTER, ACCOUNTS } from "../accounts";
import { stringToBigInt } from "common/utils/bigint";

describe("Capture Multiple Froglins", () => {
  const timeout = 40_000;
  const FROGLIN_COUNT = 50;
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
    ];
    await Promise.all(promises);

    // create a contract instance per wallet
    ACCOUNTS.alice.contracts.gateway = GAME_MASTER.contracts.gateway.withWallet(
      ACCOUNTS.alice.wallet,
    );
    ACCOUNTS.bob.contracts.gateway = GAME_MASTER.contracts.gateway.withWallet(
      ACCOUNTS.bob.wallet,
    );

    console.log("Registering accounts and starting event...");

    const alice = stringToBigInt("alice");
    const bob = stringToBigInt("bob");

    promises = [
      ACCOUNTS.alice.contracts.gateway.methods.register(alice).send().wait(),
      ACCOUNTS.bob.contracts.gateway.methods.register(bob).send().wait(),
    ];

    await Promise.all(promises);

    console.log("Starting event...");

    await GAME_MASTER.contracts.gateway.methods
      .start_event(FROGLIN_COUNT, EPOCH_COUNT, EPOCH_DURATION, Date.now())
      .send()
      .wait();
  });

  test(
    "registered account can capture multiple Froglins of the same type",
    async () => {
      const froglin_count = Number(
        await GAME_MASTER.contracts.gateway.methods.view_froglin_count().simulate(),
      );

      const capture_array = [1, 1, 0, 0, 0, 0, 0, 0, 0, 0];

      await ACCOUNTS.alice.contracts.gateway.methods
        .capture_froglins(capture_array)
        .send()
        .wait();

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

      const new_froglin_count = Number(
        await GAME_MASTER.contracts.gateway.methods.view_froglin_count().simulate(),
      );
      expect(new_froglin_count).toEqual(froglin_count - 2);
    },
    timeout,
  );

  test(
    "registered account can max out capture of multiple Froglins of the same type",
    async () => {
      const froglin_count = Number(
        await GAME_MASTER.contracts.gateway.methods.view_froglin_count().simulate(),
      );

      const capture_array = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

      await ACCOUNTS.alice.contracts.gateway.methods
        .capture_froglins(capture_array)
        .send()
        .wait();

      const stash = await ACCOUNTS.alice.contracts.gateway.methods
        .view_stash(ACCOUNTS.alice.wallet.getAddress())
        .simulate();

      expect(stash[0]).toEqual(12n);
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

      const new_froglin_count = Number(
        await GAME_MASTER.contracts.gateway.methods.view_froglin_count().simulate(),
      );
      expect(new_froglin_count).toEqual(froglin_count - 10);
    },
    timeout,
  );

  test(
    "registered account can capture multiple Froglins of mixed types",
    async () => {
      const froglin_count = Number(
        await GAME_MASTER.contracts.gateway.methods.view_froglin_count().simulate(),
      );

      const capture_array_1 = [1, 2, 3, 4, 5, 6, 0, 0, 0, 0];

      await ACCOUNTS.alice.contracts.gateway.methods
        .capture_froglins(capture_array_1)
        .send()
        .wait();

      const stash_1 = await ACCOUNTS.alice.contracts.gateway.methods
        .view_stash(ACCOUNTS.alice.wallet.getAddress())
        .simulate();

      expect(stash_1[0]).toEqual(13n);
      expect(stash_1[1]).toEqual(1n);
      expect(stash_1[2]).toEqual(1n);
      expect(stash_1[3]).toEqual(1n);
      expect(stash_1[4]).toEqual(1n);
      expect(stash_1[5]).toEqual(1n);
      expect(stash_1[6]).toEqual(0n);
      expect(stash_1[7]).toEqual(0n);
      expect(stash_1[8]).toEqual(0n);
      expect(stash_1[9]).toEqual(0n);
      expect(stash_1[10]).toEqual(0n);
      expect(stash_1[11]).toEqual(0n);

      const new_froglin_count_1 = Number(
        await GAME_MASTER.contracts.gateway.methods.view_froglin_count().simulate(),
      );
      expect(new_froglin_count_1).toEqual(froglin_count - 6);

      const capture_array_2 = [7, 8, 9, 10, 11, 12, 0, 0, 0, 0];

      await ACCOUNTS.alice.contracts.gateway.methods
        .capture_froglins(capture_array_2)
        .send()
        .wait();

      const stash_2 = await ACCOUNTS.alice.contracts.gateway.methods
        .view_stash(ACCOUNTS.alice.wallet.getAddress())
        .simulate();

      expect(stash_2[0]).toEqual(13n);
      expect(stash_2[1]).toEqual(1n);
      expect(stash_2[2]).toEqual(1n);
      expect(stash_2[3]).toEqual(1n);
      expect(stash_2[4]).toEqual(1n);
      expect(stash_2[5]).toEqual(1n);
      expect(stash_2[6]).toEqual(1n);
      expect(stash_2[7]).toEqual(1n);
      expect(stash_2[8]).toEqual(1n);
      expect(stash_2[9]).toEqual(1n);
      expect(stash_2[10]).toEqual(1n);
      expect(stash_2[11]).toEqual(1n);

      const new_froglin_count_2 = Number(
        await GAME_MASTER.contracts.gateway.methods.view_froglin_count().simulate(),
      );
      expect(new_froglin_count_2).toEqual(froglin_count - 12);
    },
    timeout,
  );

  test(
    "registered account can max out capture of multiple Froglins of mixed types",
    async () => {
      const froglin_count = Number(
        await GAME_MASTER.contracts.gateway.methods.view_froglin_count().simulate(),
      );

      const capture_array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      await ACCOUNTS.alice.contracts.gateway.methods
        .capture_froglins(capture_array)
        .send()
        .wait();

      const stash = await ACCOUNTS.alice.contracts.gateway.methods
        .view_stash(ACCOUNTS.alice.wallet.getAddress())
        .simulate();

      expect(stash[0]).toEqual(14n);
      expect(stash[1]).toEqual(2n);
      expect(stash[2]).toEqual(2n);
      expect(stash[3]).toEqual(2n);
      expect(stash[4]).toEqual(2n);
      expect(stash[5]).toEqual(2n);
      expect(stash[6]).toEqual(2n);
      expect(stash[7]).toEqual(2n);
      expect(stash[8]).toEqual(2n);
      expect(stash[9]).toEqual(2n);
      expect(stash[10]).toEqual(1n);
      expect(stash[11]).toEqual(1n);

      const new_froglin_count = Number(
        await GAME_MASTER.contracts.gateway.methods.view_froglin_count().simulate(),
      );
      expect(new_froglin_count).toEqual(froglin_count - 10);
    },
    timeout,
  );

  test(
    "a different registered account can max out capture of multiple Froglins of mixed types",
    async () => {
      const froglin_count = Number(
        await GAME_MASTER.contracts.gateway.methods.view_froglin_count().simulate(),
      );

      const capture_array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      await ACCOUNTS.bob.contracts.gateway.methods
        .capture_froglins(capture_array)
        .send()
        .wait();

      const stash = await ACCOUNTS.bob.contracts.gateway.methods
        .view_stash(ACCOUNTS.bob.wallet.getAddress())
        .simulate();

      expect(stash[0]).toEqual(1n);
      expect(stash[1]).toEqual(1n);
      expect(stash[2]).toEqual(1n);
      expect(stash[3]).toEqual(1n);
      expect(stash[4]).toEqual(1n);
      expect(stash[5]).toEqual(1n);
      expect(stash[6]).toEqual(1n);
      expect(stash[7]).toEqual(1n);
      expect(stash[8]).toEqual(1n);
      expect(stash[9]).toEqual(1n);
      expect(stash[10]).toEqual(0n);
      expect(stash[11]).toEqual(0n);

      const new_froglin_count = Number(
        await GAME_MASTER.contracts.gateway.methods.view_froglin_count().simulate(),
      );
      expect(new_froglin_count).toEqual(froglin_count - 10);
    },
    timeout,
  );
});
