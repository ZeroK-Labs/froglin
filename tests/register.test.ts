import { beforeAll, describe, expect, test } from "bun:test";

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
      const nameAsBigInt = stringToBigInt("alice");

      await ACCOUNTS.alice.contracts.gateway.methods
        .register(nameAsBigInt)
        .send()
        .wait();

      const storedNameAsBigInt = await ACCOUNTS.alice.contracts.gateway.methods
        .view_name(ACCOUNTS.alice.wallet.getAddress())
        .simulate();

      expect(storedNameAsBigInt).toBe(nameAsBigInt);
    },
    timeout,
  );

  test("fails when trying to register the same player twice", () => {
    expect(
      ACCOUNTS.alice.contracts.gateway.methods
        .register(stringToBigInt("alice"))
        .send()
        .wait(),
    ).rejects.toThrow("Assertion failed: player is already registered");
  });

  test("fails when game master tries to register", () => {
    expect(
      GAME_MASTER.contracts.gateway.methods
        .register(stringToBigInt("game master"))
        .send()
        .wait(),
    ).rejects.toThrow("Assertion failed: game master cannot register as player");
  });

  test("fails when an un-registered account tries to read its name", () => {
    expect(
      ACCOUNTS.bob.contracts.gateway.methods
        .view_name(ACCOUNTS.bob.wallet.getAddress())
        .simulate(),
    ).rejects.toThrow("Assertion failed: only registered players can call this method");
  });

  test("fails when an un-registered account tries to read the name of a registered account", () => {
    expect(
      ACCOUNTS.bob.contracts.gateway.methods
        .view_name(ACCOUNTS.alice.wallet.getAddress())
        .simulate(),
    ).rejects.toThrow("Assertion failed: Attempted to read past end of BoundedVec");
  });

  test("fails when a registered account tries to read the name of an un-registered account", () => {
    expect(
      ACCOUNTS.alice.contracts.gateway.methods
        .view_name(ACCOUNTS.bob.wallet.getAddress())
        .simulate(),
    ).rejects.toThrow("Assertion failed: only registered players can call this method");
  });

  test(
    "fails when a registered account tries to read the name of a different registered account",
    async () => {
      await ACCOUNTS.charlie.contracts.gateway.methods
        .register(stringToBigInt("charlie"))
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
      const nameAsBigInt = stringToBigInt("alice in wonderland");

      await ACCOUNTS.alice.contracts.gateway.methods
        .update_name(nameAsBigInt)
        .send()
        .wait();

      const storedNameAsBigInt = await ACCOUNTS.alice.contracts.gateway.methods
        .view_name(ACCOUNTS.alice.wallet.getAddress())
        .simulate();

      expect(storedNameAsBigInt).toBe(nameAsBigInt);
    },
    timeout,
  );

  test("fails when an un-registered account tries to update its name in the registry", () => {
    expect(
      ACCOUNTS.bob.contracts.gateway.methods
        .update_name(stringToBigInt("bob in wonderland"))
        .send()
        .wait(),
    ).rejects.toThrow("Assertion failed: only registered players can call this method");
  });
});
