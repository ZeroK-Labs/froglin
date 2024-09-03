import { beforeAll, describe, expect, test } from "bun:test";

import { FroglinGatewayContract } from "aztec/contracts/gateway/artifact/FroglinGateway";
import { GAME_MASTER, ACCOUNTS } from "./accounts";
import { TxStatus } from "@aztec/aztec.js";
import { assert } from "console";

describe("Event Lifetime Tests", () => {
  const timeout = 40_000;
  const FROGLIN_COUNT = 5;
  const EPOCH_COUNT = 3;
  const EPOCH_DURATION = 20_000;

  function advance_epoch() {
    return new Promise(async (resolve, reject) => {
      const epoch_start_time = Number(
        await GAME_MASTER.contracts.gateway.methods.view_epoch_start_time().simulate(),
      );
      assert(epoch_start_time !== 0, "epoch_start_time expected to be !== 0");

      const waitTime = EPOCH_DURATION - (Date.now() - epoch_start_time);

      setTimeout(() => {
        GAME_MASTER.contracts.gateway.methods
          .advance_epoch()
          .send()
          .wait()
          .then((tx) => resolve(tx))
          .catch((e) => reject(e));
      }, waitTime);
    });
  }

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
    ];
    await Promise.all(promises);

    // create a contract instance per wallet
    ACCOUNTS.alice.contracts.gateway = GAME_MASTER.contracts.gateway.withWallet(
      ACCOUNTS.alice.wallet,
    );
  });

  test("fails when game master tries to start the event with froglin count less than minimum allowed", () => {
    expect(
      GAME_MASTER.contracts.gateway.methods
        .start_event(0, EPOCH_COUNT, EPOCH_DURATION, Date.now())
        .send()
        .wait(),
    ).rejects.toThrow("Assertion failed: froglin count should be at least 5");
  });

  test("fails when game master tries to start the event with epoch count less than minimum allowed", () => {
    expect(
      GAME_MASTER.contracts.gateway.methods
        .start_event(FROGLIN_COUNT, 0, EPOCH_DURATION, Date.now())
        .send()
        .wait(),
    ).rejects.toThrow("Assertion failed: epoch count should be at least 3");
  });

  test("fails when game master tries to start the event with epoch duration less than minimum allowed", () => {
    expect(
      GAME_MASTER.contracts.gateway.methods
        .start_event(FROGLIN_COUNT, EPOCH_COUNT, 0, Date.now())
        .send()
        .wait(),
    ).rejects.toThrow("Assertion failed: epoch duration should be at least 20 seconds");
  });

  test(
    "game master can start the event with acceptable parameters",
    async () => {
      const start_time = Date.now();

      await GAME_MASTER.contracts.gateway.methods
        .start_event(FROGLIN_COUNT, EPOCH_COUNT, EPOCH_DURATION, start_time)
        .send()
        .wait();

      const froglin_count = Number(
        await GAME_MASTER.contracts.gateway.methods.view_froglin_count().simulate(),
      );
      expect(froglin_count).toEqual(FROGLIN_COUNT);

      const epoch_count = Number(
        await GAME_MASTER.contracts.gateway.methods.view_epoch_count().simulate(),
      );
      expect(epoch_count).toEqual(EPOCH_COUNT);

      const epoch_duration = Number(
        await GAME_MASTER.contracts.gateway.methods.view_epoch_duration().simulate(),
      );
      expect(epoch_duration).toEqual(EPOCH_DURATION);

      const epoch_start_time = Number(
        await GAME_MASTER.contracts.gateway.methods.view_epoch_start_time().simulate(),
      );
      expect(epoch_start_time).toEqual(start_time);
    },
    timeout,
  );

  test("fails when game master tries to start an ongoing event", () => {
    expect(
      GAME_MASTER.contracts.gateway.methods
        .start_event(FROGLIN_COUNT, EPOCH_COUNT, EPOCH_DURATION, Date.now())
        .send()
        .wait(),
    ).rejects.toThrow("Assertion failed: event already started");
  });

  test("fails when other account tries to start the event", () => {
    expect(
      ACCOUNTS.alice.contracts.gateway.methods
        .start_event(FROGLIN_COUNT, EPOCH_COUNT, EPOCH_DURATION, Date.now())
        .send()
        .wait(),
    ).rejects.toThrow("Assertion failed: only game master can call this method");
  });

  test(
    "game master can advance the epoch when time elapsed",
    async () => {
      const epoch_count = Number(
        await GAME_MASTER.contracts.gateway.methods.view_epoch_count().simulate(),
      );
      assert(epoch_count !== 0, `epoch_count cannot be 0, found ${epoch_count}`);

      const epoch_start_time = Number(
        await GAME_MASTER.contracts.gateway.methods.view_epoch_start_time().simulate(),
      );
      assert(
        epoch_start_time !== 0,
        `epoch_start_time to be !== 0, found ${epoch_start_time}`,
      );

      await advance_epoch();

      const new_epoch_count = await GAME_MASTER.contracts.gateway.methods
        .view_epoch_count()
        .simulate();
      expect(Number(new_epoch_count)).toEqual(epoch_count - 1);

      const new_epoch_start_time = await GAME_MASTER.contracts.gateway.methods
        .view_epoch_start_time()
        .simulate();
      expect(Number(new_epoch_start_time)).toEqual(epoch_start_time + EPOCH_DURATION);
    },
    timeout,
  );

  test(
    "fails when other account tries to advance the epoch",
    () => {
      expect(
        ACCOUNTS.alice.contracts.gateway.methods.advance_epoch().send().wait(),
      ).rejects.toThrow("Assertion failed: only game master can call this method");
    },
    timeout,
  );

  test(
    "fails when game master tries to advance the epoch after the event expires",
    async () => {
      // there are three epochs in total and we already advanced the epoch once in the tests above

      const epoch_count = Number(
        await GAME_MASTER.contracts.gateway.methods.view_epoch_count().simulate(),
      );
      assert(epoch_count === 2, `epoch_count expected to be 2, found ${epoch_count}`);

      await advance_epoch();

      const new_epoch_count = Number(
        await GAME_MASTER.contracts.gateway.methods.view_epoch_count().simulate(),
      );
      assert(
        new_epoch_count === 1,
        `epoch_count expected to be 1, found ${new_epoch_count}`,
      );

      expect(advance_epoch()).rejects.toThrow("Assertion failed: event expired");
    },
    timeout,
  );

  test(
    "game master can restart the event after it expires",
    async () => {
      const epoch_count = Number(
        await GAME_MASTER.contracts.gateway.methods.view_epoch_count().simulate(),
      );
      assert(epoch_count === 1, `epoch_count expected to be 1, found ${epoch_count}`);

      expect(
        GAME_MASTER.contracts.gateway.methods
          .start_event(FROGLIN_COUNT, EPOCH_COUNT, EPOCH_DURATION, Date.now())
          .send()
          .wait(),
      ).resolves.toHaveProperty("status", TxStatus.SUCCESS);
    },
    timeout,
  );
});
