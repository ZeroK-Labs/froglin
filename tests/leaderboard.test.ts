import { beforeAll, describe, expect, test } from "bun:test";

import { GAME_MASTER, ACCOUNTS } from "./accounts";
import { deploy_contract } from "./gateway_contract";
import { stringToBigInt } from "common/utils/bigint";

const MAX_PLAYERS = 32;

describe("Leaderboard", () => {
  const timeout = 40_000;
  const FROGLIN_COUNT = 8;
  const EPOCH_COUNT = 3;
  const EPOCH_DURATION = 20_000;

  beforeAll(async () => {
    console.log("\nSetting up test suite...\n");

    await deploy_contract([ACCOUNTS.alice, ACCOUNTS.bob, ACCOUNTS.charlie]);

    console.log("Starting event...");

    await GAME_MASTER.contracts.gateway.methods
      .start_event(FROGLIN_COUNT, EPOCH_COUNT, EPOCH_DURATION, Date.now())
      .send()
      .wait();

    console.log("\nRunning tests...\n");
  });

  test("can be viewed by any account", () => {
    expect(
      GAME_MASTER.contracts.gateway.methods.view_leaderboard().simulate(),
    ).resolves.toBeDefined();
    expect(
      ACCOUNTS.alice.contracts.gateway.methods.view_leaderboard().simulate(),
    ).resolves.toBeDefined();
    expect(
      ACCOUNTS.bob.contracts.gateway.methods.view_leaderboard().simulate(),
    ).resolves.toBeDefined();
    expect(
      ACCOUNTS.charlie.contracts.gateway.methods.view_leaderboard().simulate(),
    ).resolves.toBeDefined();
  });

  test("has max players entries after initialization", () => {
    expect(
      GAME_MASTER.contracts.gateway.methods.view_leaderboard().simulate(),
    ).resolves.toHaveLength(MAX_PLAYERS);
  });

  test(
    "has all scores set to 0 after initialization",
    async () => {
      const leaderboard = await GAME_MASTER.contracts.gateway.methods
        .view_leaderboard()
        .simulate();

      for (const entry of leaderboard) expect(entry.score).toBe(0n);
    },
    timeout,
  );

  test(
    "has all addresses set to 0 after initialization",
    async () => {
      const leaderboard = await GAME_MASTER.contracts.gateway.methods
        .view_leaderboard()
        .simulate();

      for (const entry of leaderboard) expect(entry.player === 0n);
    },
    timeout,
  );

  test(
    "address list is updated when a new player registers",
    async () => {
      await ACCOUNTS.alice.contracts.gateway.methods
        .register(stringToBigInt("alice"))
        .send()
        .wait();

      const leaderboard = await GAME_MASTER.contracts.gateway.methods
        .view_leaderboard()
        .simulate();

      const expectedEntry = {
        player: ACCOUNTS.alice.wallet.getAddress().toBigInt(),
        score: 0n,
      };

      expect(leaderboard).toContainEqual(expectedEntry);
    },
    timeout,
  );

  test(
    "score is increased when a registered account captures a Froglin",
    async () => {
      await ACCOUNTS.alice.contracts.gateway.methods.capture_froglin(0).send().wait();

      const leaderboard = await ACCOUNTS.alice.contracts.gateway.methods
        .view_leaderboard()
        .simulate();

      const expectedEntry = {
        player: ACCOUNTS.alice.wallet.getAddress().toBigInt(),
        score: 1n,
      };
      expect(leaderboard).toContainEqual(expectedEntry);
    },
    timeout,
  );

  test(
    "score is increased when a registered account captures multiple Froglins of the same type",
    async () => {
      await ACCOUNTS.alice.contracts.gateway.methods.capture_froglin(0).send().wait();
      await ACCOUNTS.alice.contracts.gateway.methods.capture_froglin(0).send().wait();
      await ACCOUNTS.alice.contracts.gateway.methods.capture_froglin(0).send().wait();

      const leaderboard = await ACCOUNTS.alice.contracts.gateway.methods
        .view_leaderboard()
        .simulate();

      const expectedEntry = {
        player: ACCOUNTS.alice.wallet.getAddress().toBigInt(),
        score: 4n,
      };
      expect(leaderboard).toContainEqual(expectedEntry);
    },
    timeout,
  );

  test(
    "score is increased when a registered account captures multiple Froglins of mixed types",
    async () => {
      await ACCOUNTS.alice.contracts.gateway.methods.capture_froglin(1).send().wait();
      await ACCOUNTS.alice.contracts.gateway.methods.capture_froglin(2).send().wait();
      await ACCOUNTS.alice.contracts.gateway.methods.capture_froglin(3).send().wait();

      const leaderboard = await ACCOUNTS.alice.contracts.gateway.methods
        .view_leaderboard()
        .simulate();

      const expectedEntry = {
        player: ACCOUNTS.alice.wallet.getAddress().toBigInt(),
        score: 7n,
      };
      expect(leaderboard).toContainEqual(expectedEntry);
    },
    timeout,
  );
});
