import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createPXEClient } from "@aztec/aztec.js";

import { AccountWithContracts } from "./types";
import { FroglinGatewayContract } from "../aztec/contracts/gateway/artifact/FroglinGateway";
import { createPXE, destroyPXE } from "./utils/PXE";
import { createWallet } from "../common/WalletManager";
import { stringToBigInt } from "../common/utils/bigint";

describe("Registration Tests", () => {
  const timeout = 40_000;

  const game_master = { contracts: {} } as AccountWithContracts;
  const alice = { contracts: {} } as AccountWithContracts;
  const bob = { contracts: {} } as AccountWithContracts;
  const charlie = { contracts: {} } as AccountWithContracts;

  beforeAll(async () => {
    console.log("Creating deployment account...");

    game_master.secret = "0x123";
    game_master.pxe_url = process.env.SANDBOX_URL!;
    game_master.pxe = createPXEClient(game_master.pxe_url);
    game_master.wallet = await createWallet(game_master.secret, game_master.pxe);

    console.log("Deployment account created successfully!");

    console.log("Deploying contract...");

    game_master.contracts.gateway = await FroglinGatewayContract.deploy(
      game_master.wallet,
    )
      .send()
      .deployed();

    expect(game_master.contracts.gateway).not.toBeNull();

    // initialize test accounts

    // create secrets
    alice.secret = "0xabc";
    bob.secret = "0xdef";
    charlie.secret = "0xabcdef";

    // create PXE servers
    let promises: Promise<any>[] = [
      createPXE().then((url) => {
        alice.pxe_url = url;
      }),
      createPXE().then((url) => {
        bob.pxe_url = url;
      }),
      createPXE().then((url) => {
        charlie.pxe_url = url;
      }),
    ];
    await Promise.all(promises);

    // create PXE clients
    alice.pxe = createPXEClient(alice.pxe_url);
    bob.pxe = createPXEClient(bob.pxe_url);
    charlie.pxe = createPXEClient(charlie.pxe_url);

    // instantiate wallet per each PXE
    promises = [
      createWallet(alice.secret, alice.pxe).then((wallet) => {
        alice.wallet = wallet;
      }),
      createWallet(bob.secret, bob.pxe).then((wallet) => {
        bob.wallet = wallet;
      }),
      createWallet(charlie.secret, charlie.pxe).then((wallet) => {
        charlie.wallet = wallet;
      }),
    ];
    await Promise.all(promises);

    // register deployed contract in each PXE
    promises = [
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

  afterAll(() => {
    destroyPXE(alice.pxe_url);
    destroyPXE(bob.pxe_url);
    destroyPXE(charlie.pxe_url);
  });

  it(
    "registers player with expected name",
    async () => {
      const nameAsField = stringToBigInt("alice");

      await alice.contracts.gateway.methods.register(nameAsField).send().wait();

      const storedNameAsField = await alice.contracts.gateway.methods
        .view_name(alice.wallet.getAddress())
        .simulate();

      expect(nameAsField).toBe(storedNameAsField);
    },
    timeout,
  );

  it("fails when an un-registered account tries to read its name", () => {
    expect(
      bob.contracts.gateway.methods.view_name(bob.wallet.getAddress()).simulate(),
    ).rejects.toThrow("Assertion failed: method callable only by registered players");
  });

  it("fails when an un-registered account tries to read the name of a registered account", () => {
    expect(
      bob.contracts.gateway.methods.view_name(alice.wallet.getAddress()).simulate(),
    ).rejects.toThrow("Assertion failed: Attempted to read past end of BoundedVec");
  });

  it(
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

  it("fails when an un-registered account tries to update its name in the registry", () => {
    const nameAsField = stringToBigInt("bob in wonderland");

    expect(
      bob.contracts.gateway.methods.update_name(nameAsField).send().wait(),
    ).rejects.toThrow("Assertion failed: method callable only by registered players");
  });

  it(
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
});
