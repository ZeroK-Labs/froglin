import { beforeAll, describe, expect, test } from "bun:test";

import { FroglinGatewayContract } from "aztec/contracts/gateway/artifact/FroglinGateway";
import { GAME_MASTER, ACCOUNTS } from "tests/accounts";
import { stringToBigInt } from "common/utils/bigint";

describe("Concurrent Froglin Capture", () => {
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
    const bob = stringToBigInt("bob");
    const charlie = stringToBigInt("charlie");

    promises = [
      ACCOUNTS.alice.contracts.gateway.methods.register(alice).send().wait(),
      ACCOUNTS.bob.contracts.gateway.methods.register(bob).send().wait(),
      ACCOUNTS.charlie.contracts.gateway.methods.register(charlie).send().wait(),
    ];

    await Promise.all(promises);

    console.log("Starting event...");

    await GAME_MASTER.contracts.gateway.methods
      .start_event(FROGLIN_COUNT, EPOCH_COUNT, EPOCH_DURATION, Date.now())
      .send()
      .wait();
  });

  test(
    "multiple accounts can each capture a Froglin of the same type at the same time",
    async () => {
      const froglin_count = Number(
        await GAME_MASTER.contracts.gateway.methods.view_froglin_count().simulate(),
      );

      let promises: Promise<any>[] = [
        ACCOUNTS.alice.contracts.gateway.methods.capture_froglin(0).send().wait(),
        ACCOUNTS.bob.contracts.gateway.methods.capture_froglin(0).send().wait(),
        // ACCOUNTS.charlie.contracts.gateway.methods.capture_froglin(0).send().wait(),
      ];

      await Promise.all(promises);

      const new_froglin_count = Number(
        await GAME_MASTER.contracts.gateway.methods.view_froglin_count().simulate(),
      );
      expect(new_froglin_count).toEqual(froglin_count - 2 /*3*/);

      // const aliceStash = await ACCOUNTS.alice.contracts.gateway.methods
      //   .view_stash(ACCOUNTS.alice.wallet.getAddress())
      //   .simulate();
      // const bobStash = await ACCOUNTS.bob.contracts.gateway.methods
      //     .view_stash(ACCOUNTS.bob.wallet.getAddress())
      //     .simulate();
      // const charlieStash = await ACCOUNTS.charlie.contracts.gateway.methods
      //   .view_stash(ACCOUNTS.charlie.wallet.getAddress())
      //   .simulate();

      promises = [
        ACCOUNTS.alice.contracts.gateway.methods
          .view_stash(ACCOUNTS.alice.wallet.getAddress())
          .simulate(),
        ACCOUNTS.bob.contracts.gateway.methods
          .view_stash(ACCOUNTS.bob.wallet.getAddress())
          .simulate(),
        //   ACCOUNTS.charlie.contracts.gateway.methods
        //     .view_stash(ACCOUNTS.charlie.wallet.getAddress())
        //     .simulate(),
      ];

      const [aliceStash, bobStash] = await Promise.all(promises);
      // const [aliceStash, bobStash, charlieStash] = await Promise.all(promises);

      expect(aliceStash[0]).toEqual(1n);
      expect(aliceStash[1]).toEqual(0n);
      expect(aliceStash[2]).toEqual(0n);
      expect(aliceStash[3]).toEqual(0n);
      expect(aliceStash[4]).toEqual(0n);
      expect(aliceStash[5]).toEqual(0n);
      expect(aliceStash[6]).toEqual(0n);
      expect(aliceStash[7]).toEqual(0n);
      expect(aliceStash[8]).toEqual(0n);
      expect(aliceStash[9]).toEqual(0n);
      expect(aliceStash[10]).toEqual(0n);
      expect(aliceStash[11]).toEqual(0n);

      expect(bobStash[0]).toEqual(1n);
      expect(bobStash[1]).toEqual(0n);
      expect(bobStash[2]).toEqual(0n);
      expect(bobStash[3]).toEqual(0n);
      expect(bobStash[4]).toEqual(0n);
      expect(bobStash[5]).toEqual(0n);
      expect(bobStash[6]).toEqual(0n);
      expect(bobStash[7]).toEqual(0n);
      expect(bobStash[8]).toEqual(0n);
      expect(bobStash[9]).toEqual(0n);
      expect(bobStash[10]).toEqual(0n);
      expect(bobStash[11]).toEqual(0n);

      // expect(charlieStash[0]).toEqual(1n);
      // expect(charlieStash[1]).toEqual(0n);
      // expect(charlieStash[2]).toEqual(0n);
      // expect(charlieStash[3]).toEqual(0n);
      // expect(charlieStash[4]).toEqual(0n);
      // expect(charlieStash[5]).toEqual(0n);
      // expect(charlieStash[6]).toEqual(0n);
      // expect(charlieStash[7]).toEqual(0n);
      // expect(charlieStash[8]).toEqual(0n);
      // expect(charlieStash[9]).toEqual(0n);
      // expect(charlieStash[10]).toEqual(0n);
      // expect(charlieStash[11]).toEqual(0n);
    },
    timeout,
  );

  test(
    "multiple accounts can each capture a different number of Froglin of mixed types at the same time",
    async () => {
      const froglin_count = Number(
        await GAME_MASTER.contracts.gateway.methods.view_froglin_count().simulate(),
      );

      let promises: Promise<any>[] = [
        ACCOUNTS.alice.contracts.gateway.methods.capture_froglin(1).send().wait(),
        ACCOUNTS.alice.contracts.gateway.methods.capture_froglin(2).send().wait(),
        // ACCOUNTS.bob.contracts.gateway.methods.capture_froglin(4).send().wait(),
        // ACCOUNTS.bob.contracts.gateway.methods.capture_froglin(5).send().wait(),
        // ACCOUNTS.charlie.contracts.gateway.methods.capture_froglin(6).send().wait(),
        // ACCOUNTS.charlie.contracts.gateway.methods.capture_froglin(7).send().wait(),
      ];

      await Promise.all(promises);

      const new_froglin_count = Number(
        await GAME_MASTER.contracts.gateway.methods.view_froglin_count().simulate(),
      );
      expect(new_froglin_count).toEqual(froglin_count - 2);

      // promises = [
      //   ACCOUNTS.alice.contracts.gateway.methods
      //     .view_stash(ACCOUNTS.alice.wallet.getAddress())
      //     .simulate(),
      //   ACCOUNTS.bob.contracts.gateway.methods
      //     .view_stash(ACCOUNTS.bob.wallet.getAddress())
      //     .simulate(),
      //   //   ACCOUNTS.charlie.contracts.gateway.methods
      //   //     .view_stash(ACCOUNTS.charlie.wallet.getAddress())
      //   //     .simulate(),
      // ];

      // const [aliceStash, bobStash] = await Promise.all(promises);
      // // const [aliceStash, bobStash, charlieStash] = await Promise.all(promises);

      // expect(aliceStash[0]).toEqual(2n);
      // expect(aliceStash[1]).toEqual(1n);
      // expect(aliceStash[2]).toEqual(1n);
      // expect(aliceStash[3]).toEqual(1n);
      // expect(aliceStash[4]).toEqual(0n);
      // expect(aliceStash[5]).toEqual(0n);
      // expect(aliceStash[6]).toEqual(0n);
      // expect(aliceStash[7]).toEqual(0n);
      // expect(aliceStash[8]).toEqual(0n);
      // expect(aliceStash[9]).toEqual(0n);
      // expect(aliceStash[10]).toEqual(0n);
      // expect(aliceStash[11]).toEqual(0n);

      // expect(bobStash[0]).toEqual(1n);
      // expect(bobStash[1]).toEqual(0n);
      // expect(bobStash[2]).toEqual(0n);
      // expect(bobStash[3]).toEqual(0n);
      // expect(bobStash[4]).toEqual(1n);
      // expect(bobStash[5]).toEqual(1n);
      // expect(bobStash[6]).toEqual(1n);
      // expect(bobStash[7]).toEqual(1n);
      // expect(bobStash[8]).toEqual(1n);
      // // expect(bobStash[9]).toEqual(0n);
      // // expect(bobStash[10]).toEqual(0n);
      // // expect(bobStash[11]).toEqual(0n);
      // expect(bobStash[9]).toEqual(1n);
      // expect(bobStash[10]).toEqual(1n);
      // expect(bobStash[11]).toEqual(1n);

      // // expect(charlieStash[0]).toEqual(1n);
      // // expect(charlieStash[1]).toEqual(0n);
      // // expect(charlieStash[2]).toEqual(0n);
      // // expect(charlieStash[3]).toEqual(0n);
      // // expect(charlieStash[4]).toEqual(0n);
      // // expect(charlieStash[5]).toEqual(0n);
      // // expect(charlieStash[6]).toEqual(0n);
      // // expect(charlieStash[7]).toEqual(0n);
      // // expect(charlieStash[8]).toEqual(0n);
      // // expect(charlieStash[9]).toEqual(1n);
      // // expect(charlieStash[10]).toEqual(1n);
      // // expect(charlieStash[11]).toEqual(1n);
    },
    timeout,
  );
});
