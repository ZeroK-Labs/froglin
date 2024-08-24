import { beforeAll, describe, expect, test } from "bun:test";

import { FroglinGatewayContract } from "aztec/contracts/gateway/artifact/FroglinGateway";
import { GAME_MASTER, ACCOUNTS } from "./accounts";
import { stringToBigInt } from "common/utils/bigint";

describe("Stash Tests", () => {
  const timeout = 40_000;

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
      ACCOUNTS.bob.wallet,
    );
  });

  test(
    "registered account can capture Froglin",
    async () => {
      await ACCOUNTS.alice.contracts.gateway.methods
        .register(stringToBigInt("alice"))
        .send()
        .wait();

      await ACCOUNTS.alice.contracts.gateway.methods.capture_froglin(1).send().wait();

      const stash = await ACCOUNTS.alice.contracts.gateway.methods
        .view_stash(ACCOUNTS.alice.wallet.getAddress())
        .simulate();
      expect(stash.storage[1]).toEqual(1n);
    },
    timeout,
  );

  test(
    "fails when unregistered account tries to capture Froglin",
    () => {
      expect(
        ACCOUNTS.bob.contracts.gateway.methods.capture_froglin(1).send().wait(),
      ).rejects.toThrow("Assertion failed: method callable only by registered players");
    },
    timeout,
  );
});
