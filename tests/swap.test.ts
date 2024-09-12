import { beforeAll, describe, expect, test } from "bun:test";

import { Fr } from "@aztec/aztec.js";
import { FroglinGatewayContract } from "aztec/contracts/gateway/artifact/FroglinGateway";
import { GAME_MASTER, ACCOUNTS } from "./accounts";
import { stringToBigInt } from "common/utils/bigint";
// import { assert } from "console";

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
    "registered account can authorize another account to call increment_froglin",
    async () => {
      const nonce = Fr.random();

      await GAME_MASTER.contracts.gateway.methods
        .start_event(FROGLIN_COUNT, EPOCH_COUNT, EPOCH_DURATION, Date.now())
        .send()
        .wait();

      console.log("alice", ACCOUNTS.alice.wallet.getAddress());
      console.log("charlie", ACCOUNTS.charlie.wallet.getAddress());
      const action = GAME_MASTER.contracts.gateway
        .withWallet(ACCOUNTS.charlie.wallet)
        .methods.increment_froglin(1, ACCOUNTS.alice.wallet.getAddress(), nonce);

      const witness = await ACCOUNTS.alice.wallet.createAuthWit({
        caller: ACCOUNTS.charlie.wallet.getAddress(),
        action,
      });
      await ACCOUNTS.charlie.wallet.addAuthWitness(witness);

      ACCOUNTS.charlie.wallet.setScopes([
        ACCOUNTS.charlie.wallet.getAddress(),
        ACCOUNTS.alice.wallet.getAddress(),
      ]);
      await action.send().wait();
      // expect(
      //   await ACCOUNTS.alice.wallet.lookupValidity(ACCOUNTS.alice.wallet.getAddress(), {
      //     caller: ACCOUNTS.charlie.wallet.getAddress(),
      //     action,
      //   }),
      // ).toEqual({
      //   isValidInPrivate: true,
      //   isValidInPublic: false,
      // });
    },
    timeout,
  );
});
