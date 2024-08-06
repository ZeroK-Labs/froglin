import { beforeAll, describe, expect, test } from "bun:test";
import { TxStatus } from "@aztec/aztec.js";

import { FroglinGatewayContract } from "aztec/contracts/gateway/artifact/FroglinGateway";
import { GAME_MASTER, ACCOUNTS } from "./accounts";
import { stringToBigInt } from "common/utils/bigint";

describe("Registration Tests", () => {
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

  test("fails when trying to register the same player twice", () => {
    const nameAsField = stringToBigInt("alice");
    expect(
      ACCOUNTS.alice.contracts.gateway.methods.register(nameAsField).send().wait(),
    ).rejects.toThrow("Assertion failed: player is already registered");
  });

  test(
    "reads expected name for a registered player",
    async () => {
      const expectedNameAsBigInt = stringToBigInt("alice");

      const storedNameAsBigInt = await ACCOUNTS.alice.contracts.gateway.methods
        .view_name(ACCOUNTS.alice.wallet.getAddress())
        .simulate();

      expect(expectedNameAsBigInt).toBe(storedNameAsBigInt);
    },
    timeout,
  );

  test("fails when an un-registered account tries to read its name", () => {
    expect(
      ACCOUNTS.bob.contracts.gateway.methods
        .view_name(ACCOUNTS.bob.wallet.getAddress())
        .simulate(),
    ).rejects.toThrow("Assertion failed: method callable only by registered players");
  });

  test("fails when an un-registered account tries to read the name of a registered account", () => {
    expect(
      ACCOUNTS.bob.contracts.gateway.methods
        .view_name(ACCOUNTS.alice.wallet.getAddress())
        .simulate(),
    ).rejects.toThrow("Assertion failed: Attempted to read past end of BoundedVec");
  });

  test(
    "fails when a registered account tries to read the name of a different registered account",
    async () => {
      const nameAsField = stringToBigInt("charlie");

      await ACCOUNTS.charlie.contracts.gateway.methods
        .register(nameAsField)
        .send()
        .wait();

      expect(
        ACCOUNTS.charlie.contracts.gateway.methods
          .view_name(ACCOUNTS.alice.wallet.getAddress())
          .simulate(),
      ).rejects.toThrow("Assertion failed: Attempted to read past end of BoundedVec");
    },
    timeout,
  );

  test(
    "updates player with expected name",
    async () => {
      const nameAsField = stringToBigInt("alice in wonderland");

      await ACCOUNTS.alice.contracts.gateway.methods
        .update_name(nameAsField)
        .send()
        .wait();

      const storedNameAsField = await ACCOUNTS.alice.contracts.gateway.methods
        .view_name(ACCOUNTS.alice.wallet.getAddress())
        .simulate();

      expect(nameAsField).toBe(storedNameAsField);
    },
    timeout,
  );

  test("fails when an un-registered account tries to update its name in the registry", () => {
    const nameAsField = stringToBigInt("bob in wonderland");

    expect(
      ACCOUNTS.bob.contracts.gateway.methods.update_name(nameAsField).send().wait(),
    ).rejects.toThrow("Assertion failed: method callable only by registered players");
  });
});
