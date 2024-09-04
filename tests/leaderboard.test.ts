import { beforeAll, describe, expect, test } from "bun:test";

import { FroglinGatewayContract } from "aztec/contracts/gateway/artifact/FroglinGateway";
import { GAME_MASTER, ACCOUNTS } from "./accounts";
import { stringToBigInt } from "common/utils/bigint";

const MAX_PLAYERS = 32;

describe("Leaderboard Tests", () => {
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

    await GAME_MASTER.contracts.gateway.methods
      .start_event(FROGLIN_COUNT, EPOCH_COUNT, EPOCH_DURATION, Date.now())
      .send()
      .wait();
  });

  test("any account can view leaderboard", () => {
    expect(
      GAME_MASTER.contracts.gateway.methods.view_leaderboard().simulate(),
    ).resolves.pass();
    expect(
      ACCOUNTS.alice.contracts.gateway.methods.view_leaderboard().simulate(),
    ).resolves.pass();
    expect(
      ACCOUNTS.bob.contracts.gateway.methods.view_leaderboard().simulate(),
    ).resolves.pass();
    expect(
      ACCOUNTS.charlie.contracts.gateway.methods.view_leaderboard().simulate(),
    ).resolves.pass();
  });

  test("initially leaderboard has max players entries", () => {
    expect(
      GAME_MASTER.contracts.gateway.methods.view_leaderboard().simulate(),
    ).resolves.toHaveLength(MAX_PLAYERS);
  });

  test(
    "initially all leaderboard scores are 0",
    async () => {
      const leaderboard = await GAME_MASTER.contracts.gateway.methods
        .view_leaderboard()
        .simulate();

      for (const entry of leaderboard) expect(entry.score).toBe(0n);
    },
    timeout,
  );

  test(
    "initially all leaderboard addresses are 0",
    async () => {
      const leaderboard = await GAME_MASTER.contracts.gateway.methods
        .view_leaderboard()
        .simulate();

      for (const entry of leaderboard) expect(entry.player.isZero()).toBe(true);
    },
    timeout,
  );

  test(
    "leaderboard address is updated when a new player registers",
    async () => {
      await ACCOUNTS.alice.contracts.gateway.methods
        .register(stringToBigInt("alice"))
        .send()
        .wait();

      const leaderboard = await GAME_MASTER.contracts.gateway.methods
        .view_leaderboard()
        .simulate();

      const expectedEntry = {
        player: ACCOUNTS.alice.wallet.getAddress(),
        score: 0n,
      };

      expect(leaderboard).toContainEqual(expectedEntry);
    },
    timeout,
  );

  test(
    "leaderboard score is increased when registered account captures Froglin",
    async () => {
      const froglin_type = 1;
      await ACCOUNTS.alice.contracts.gateway.methods
        .capture_froglin(froglin_type)
        .send()
        .wait();

      const leaderboard = await ACCOUNTS.alice.contracts.gateway.methods
        .view_leaderboard()
        .simulate();

      const expectedEntry = {
        player: ACCOUNTS.alice.wallet.getAddress(),
        score: 1n,
      };

      expect(leaderboard).toContainEqual(expectedEntry);
    },
    timeout,
  );
});
