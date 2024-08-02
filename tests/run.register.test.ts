import { beforeAll, describe, expect, test } from "bun:test";
import { TxStatus } from "@aztec/aztec.js";

import AccountWithContracts from "common/types/AccountWithContracts";
import { FroglinGatewayContract } from "aztec/contracts/gateway/artifact/FroglinGateway";
import { getDeploymentAccount, getPlayerAccount } from "./accounts";
import { stringToBigInt } from "common/utils/bigint";

describe("Registration Tests", () => {
  const timeout = 40_000;

  let game_master: AccountWithContracts;
  let alice: AccountWithContracts;
  let bob: AccountWithContracts;
  let charlie: AccountWithContracts;

  beforeAll(async () => {
    game_master = await getDeploymentAccount();
    alice = await getPlayerAccount("alice");
    bob = await getPlayerAccount("bob");
    charlie = await getPlayerAccount("charlie");

    console.log("Deploying contract...");

    game_master.contracts.gateway = await FroglinGatewayContract.deploy(
      game_master.wallet,
    )
      .send()
      .deployed();

    expect(game_master.contracts.gateway).not.toBeNull();

    // register deployed contract in each PXE
    let promises: Promise<any>[] = [
      alice.pxe.registerContract({
        instance: game_master.contracts.gateway.instance,
        artifact: game_master.contracts.gateway.artifact,
      }),
      bob.pxe.registerContract({
        instance: game_master.contracts.gateway.instance,
        artifact: game_master.contracts.gateway.artifact,
      }),
      charlie.pxe.registerContract({
        instance: game_master.contracts.gateway.instance,
        artifact: game_master.contracts.gateway.artifact,
      }),
    ];
    await Promise.all(promises);

    // create a contract instance per wallet
    alice.contracts.gateway = await FroglinGatewayContract.at(
      game_master.contracts.gateway.address,
      alice.wallet,
    );
    bob.contracts.gateway = game_master.contracts.gateway.withWallet(bob.wallet);
    charlie.contracts.gateway = game_master.contracts.gateway.withWallet(
      charlie.wallet,
    );
  });

  test(
    "registers player with expected name",
    async () => {
      const expectedNameAsBigInt = stringToBigInt("alice");

      const tx = await alice.contracts.gateway.methods
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
      alice.contracts.gateway.methods.register(nameAsField).send().wait(),
    ).rejects.toThrow("Assertion failed: player is already registered");
  });

  test(
    "reads expected name for a registered player",
    async () => {
      const expectedNameAsBigInt = stringToBigInt("alice");

      const storedNameAsBigInt = await alice.contracts.gateway.methods
        .view_name(alice.wallet.getAddress())
        .simulate();

      expect(expectedNameAsBigInt).toBe(storedNameAsBigInt);
    },
    timeout,
  );

  test("fails when an un-registered account tries to read its name", () => {
    expect(
      bob.contracts.gateway.methods.view_name(bob.wallet.getAddress()).simulate(),
    ).rejects.toThrow("Assertion failed: method callable only by registered players");
  });

  test("fails when an un-registered account tries to read the name of a registered account", () => {
    expect(
      bob.contracts.gateway.methods.view_name(alice.wallet.getAddress()).simulate(),
    ).rejects.toThrow("Assertion failed: Attempted to read past end of BoundedVec");
  });

  test(
    "fails when a registered account tries to read the name of a different registered account",
    async () => {
      const nameAsField = stringToBigInt("charlie");

      await charlie.contracts.gateway.methods.register(nameAsField).send().wait();

      expect(
        charlie.contracts.gateway.methods
          .view_name(alice.wallet.getAddress())
          .simulate(),
      ).rejects.toThrow("Assertion failed: Attempted to read past end of BoundedVec");
    },
    timeout,
  );

  test(
    "updates player with expected name",
    async () => {
      const nameAsField = stringToBigInt("alice in wonderland");

      await alice.contracts.gateway.methods.update_name(nameAsField).send().wait();

      const storedNameAsField = await alice.contracts.gateway.methods
        .view_name(alice.wallet.getAddress())
        .simulate();

      expect(nameAsField).toBe(storedNameAsField);
    },
    timeout,
  );

  test("fails when an un-registered account tries to update its name in the registry", () => {
    const nameAsField = stringToBigInt("bob in wonderland");

    expect(
      bob.contracts.gateway.methods.update_name(nameAsField).send().wait(),
    ).rejects.toThrow("Assertion failed: method callable only by registered players");
  });
});
