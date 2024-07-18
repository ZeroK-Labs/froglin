import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createPXEClient } from "@aztec/aztec.js";

import { createWallet } from "../common/WalletManager";
import { FroglinContract } from "contracts/artifacts/Froglin";
import {
  AccountWithContract,
  createPXEServer,
  destroyPXEServer,
  stringToBigInt,
} from "./utils";

describe("Registration Tests", () => {
  const timeout = 40_000;

  const game_master = {} as AccountWithContract;
  const alice = {} as AccountWithContract;
  const bob = {} as AccountWithContract;
  const charlie = {} as AccountWithContract;

  beforeAll(async () => {
    console.log("Creating deployment account...");

    game_master.secret = 0x123n;
    game_master.pxe_url = "http://localhost:8080";
    game_master.pxe = createPXEClient(game_master.pxe_url);
    game_master.wallet = await createWallet(game_master.secret, game_master.pxe);

    console.log("Deployment account created successfully!");

    console.log("Deploying contract...");

    game_master.contract = await FroglinContract.deploy(game_master.wallet)
      .send()
      .deployed();

    expect(game_master.contract.instance).not.toBeNull();

    // initialize test accounts

    // create secrets
    alice.secret = 0xabcn;
    bob.secret = 0xdefn;
    charlie.secret = 0xabcdefn;

    // create PXE servers
    let promises: Promise<any>[] = [
      createPXEServer().then((url) => {
        alice.pxe_url = url;
      }),
      createPXEServer().then((url) => {
        bob.pxe_url = url;
      }),
      createPXEServer().then((url) => {
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
        instance: game_master.contract.instance,
        artifact: game_master.contract.artifact,
      }),
      bob.pxe.registerContract({
        instance: game_master.contract.instance,
        artifact: game_master.contract.artifact,
      }),
      charlie.pxe.registerContract({
        instance: game_master.contract.instance,
        artifact: game_master.contract.artifact,
      }),
    ];
    await Promise.all(promises);

    // create a contract instance per wallet
    alice.contract = game_master.contract.withWallet(alice.wallet);
    bob.contract = game_master.contract.withWallet(bob.wallet);
    charlie.contract = game_master.contract.withWallet(charlie.wallet);
  });

  afterAll(() => {
    destroyPXEServer(alice.pxe_url);
    destroyPXEServer(bob.pxe_url);
    destroyPXEServer(charlie.pxe_url);
  });

  it(
    "registers player with expected name",
    async () => {
      const nameAsField = stringToBigInt("alice");

      await alice.contract.methods.register(nameAsField).send().wait();

      const storedNameAsField = await alice.contract.methods
        .view_name(alice.wallet.getAddress())
        .simulate();

      expect(nameAsField).toBe(storedNameAsField);
    },
    timeout,
  );

  it(
    "updates player with expected name",
    async () => {
      const nameAsField = stringToBigInt("alice in wonderland");

      await alice.contract.methods.update_name(nameAsField).send().wait();

      const storedNameAsField = await alice.contract.methods
        .view_name(alice.wallet.getAddress())
        .simulate();

      expect(nameAsField).toBe(storedNameAsField);
    },
    timeout,
  );

  it("fails when an un-registered account tries to read its name", () => {
    expect(
      bob.contract.methods.view_name(bob.wallet.getAddress()).simulate(),
    ).rejects.toThrow("Assertion failed: method callable only by registered players");
  });

  it("fails when an un-registered account tries to read the name of a registered account", () => {
    expect(
      bob.contract.methods.view_name(alice.wallet.getAddress()).simulate(),
    ).rejects.toThrow("Assertion failed: Attempted to read past end of BoundedVec");
  });

  it(
    "fails when a registered account tries to read the name of a different registered account",
    async () => {
      const nameAsField = stringToBigInt("charlie");

      await charlie.contract.methods.register(nameAsField).send().wait();

      expect(
        charlie.contract.methods.view_name(alice.wallet.getAddress()).simulate(),
      ).rejects.toThrow("Assertion failed: Attempted to read past end of BoundedVec");
    },
    timeout,
  );

  it("fails when an un-registered account tries to update its name in the registry", () => {
    const nameAsField = stringToBigInt("bob in wonderland");

    expect(bob.contract.methods.update_name(nameAsField).send().wait()).rejects.toThrow(
      "Assertion failed: method callable only by registered players",
    );
  });
});
