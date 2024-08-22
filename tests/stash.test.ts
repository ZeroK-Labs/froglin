import { beforeAll, describe, expect, test } from "bun:test";
import { TxStatus } from "@aztec/aztec.js";

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
    ACCOUNTS.alice.contracts.gateway = await FroglinGatewayContract.at(
      GAME_MASTER.contracts.gateway.address,
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
    "registers player with expected name",
    async () => {
      const expectedNameAsBigInt = stringToBigInt("alice");

      const tx = await ACCOUNTS.alice.contracts.gateway.methods
        .register(expectedNameAsBigInt)
        .send()
        .wait();

      expect(tx.status).toEqual(TxStatus.SUCCESS);
    },
    timeout,
  );

  test(
    "capture froglin",
    async () => {
      await ACCOUNTS.alice.contracts.gateway.methods.capture_froglin(1).send().wait();
      const stash = await ACCOUNTS.alice.contracts.gateway.methods
        .view_stash(ACCOUNTS.alice.wallet.getAddress())
        .simulate();
      expect(stash.storage[1]).toEqual(1n);
    },
    timeout,
  );

  test(
    "unregistered account cannot capture froglin",
    () => {
      expect(
        ACCOUNTS.bob.contracts.gateway.methods.capture_froglin(1).send().wait(),
      ).rejects.toThrow("Assertion failed: method callable only by registered players");
    },
    timeout,
  );
});
