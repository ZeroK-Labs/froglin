import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createPXEClient, Fr } from "@aztec/aztec.js";

import { createWallet } from "../common/WalletManager";
import { FroglinContract } from "contracts/artifacts/Froglin";
import {
  AccountWithContract,
  createPXEServer,
  destroyPXEServer,
  stringToBigInt,
} from "./utils";

describe("EventInfo Tests", () => {
  const timeout = 60_000;

  const game_master = {} as AccountWithContract;
  const alice = {} as AccountWithContract;
  const bob = {} as AccountWithContract;

  beforeAll(async () => {
    console.log("Creating deployment account...");

    game_master.secret = 0x123n;
    game_master.pxe_url = `http://localhost:${process.env.SANDBOX_PORT}`;
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

    // create PXE servers
    let promises: Promise<any>[] = [
      createPXEServer().then((url) => {
        alice.pxe_url = url;
      }),
      createPXEServer().then((url) => {
        bob.pxe_url = url;
      }),
    ];
    await Promise.all(promises);

    // create PXE clients
    alice.pxe = createPXEClient(alice.pxe_url);
    bob.pxe = createPXEClient(bob.pxe_url);

    // instantiate wallet per each PXE
    promises = [
      createWallet(alice.secret, alice.pxe).then((wallet) => {
        alice.wallet = wallet;
      }),
      createWallet(bob.secret, bob.pxe).then((wallet) => {
        bob.wallet = wallet;
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
    ];
    await Promise.all(promises);

    // create a contract instance per wallet
    alice.contract = game_master.contract.withWallet(alice.wallet);
    bob.contract = game_master.contract.withWallet(bob.wallet);

    // register player accounts in deployment account PXE for note emission
    promises = [
      game_master.pxe.registerAccount(
        new Fr(alice.secret),
        alice.wallet.getCompleteAddress().partialAddress,
      ),
      game_master.pxe.registerAccount(
        new Fr(bob.secret),
        bob.wallet.getCompleteAddress().partialAddress,
      ),
    ];
    await Promise.all(promises);
  });

  afterAll(() => {
    destroyPXEServer(alice.pxe_url);
    destroyPXEServer(bob.pxe_url);
  });

  it("fails when non-owner account tries to create event info note", () => {
    expect(
      alice.contract.methods
        .create_event_info_note(alice.wallet.getAddress())
        .send()
        .wait(),
    ).rejects.toThrow("Assertion failed: method callable only by owner");
  });

  it("fails when owner tries to create event info note for an un-registered account", () => {
    expect(
      game_master.contract.methods
        .create_event_info_note(bob.wallet.getAddress())
        .send()
        .wait(),
    ).rejects.toThrow("Assertion failed: method callable only by registered players");
  });

  it(
    "creates event info note when called by owner for a registered account",
    async () => {
      await alice.contract.methods.register(stringToBigInt("alice")).send().wait();

      const receipt = await game_master.contract.methods
        .create_event_info_note(alice.wallet.getAddress())
        .send()
        .wait();

      expect(receipt.status as string).toBe("success");
    },
    timeout,
  );

  it("fails when an un-registered account tries to read its own event info note", () => {
    expect(
      bob.contract.methods.view_event_info(bob.wallet.getAddress()).simulate(),
    ).rejects.toThrow("Assertion failed: method callable only by registered players");
  });

  it("fails when an un-registered account tries to read the event info note of a registered account", () => {
    expect(
      bob.contract.methods.view_event_info(alice.wallet.getAddress()).simulate(),
    ).rejects.toThrow("Assertion failed: Attempted to read past end of BoundedVec");
  });

  it(
    "reads the event info note when the called by the corresponding registered account",
    async () => {
      const gameMasterEpochCount = await game_master.contract.methods
        .view_epoch_count()
        .simulate();

      const tx = await alice.contract.methods
        .view_event_info(alice.wallet.getAddress())
        .simulate();

      expect(tx.value).toBe(gameMasterEpochCount);
    },
    timeout,
  );

  it(
    "fails when a registered account tries to read event info note belonging to a different registered account",
    async () => {
      await bob.contract.methods.register(stringToBigInt("bob")).send().wait();

      await game_master.contract.methods
        .create_event_info_note(bob.wallet.getAddress())
        .send()
        .wait();

      // bob tries to read alice's secret
      expect(
        bob.contract.methods.view_event_info(alice.wallet.getAddress()).simulate(),
      ).rejects.toThrow("Assertion failed: Attempted to read past end of BoundedVec");

      // alice tries to read bob's secret
      expect(
        alice.contract.methods.view_event_info(bob.wallet.getAddress()).simulate(),
      ).rejects.toThrow("Assertion failed: Attempted to read past end of BoundedVec");
    },
    timeout,
  );
});
