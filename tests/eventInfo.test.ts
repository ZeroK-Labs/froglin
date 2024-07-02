import { beforeAll, describe, expect, it } from "bun:test";
import { Fr } from "@aztec/aztec.js";

import { FroglinContract } from "contracts/artifacts/Froglin";
import { AccountWithContract, createWallet, stringToBigInt } from "./utils";

describe("EventInfo Tests", () => {
  const timeout = 60_000;

  let game_master = {} as AccountWithContract;
  let alice = {} as AccountWithContract;
  let bob = {} as AccountWithContract;

  beforeAll(async () => {
    // initialize deployment account

    game_master.secret = 0x123n;
    game_master.wallet = await createWallet(game_master.secret);

    // deploy contract

    game_master.contract = await FroglinContract.deploy(game_master.wallet)
      .send({ contractAddressSalt: Fr.random() })
      .deployed();

    // initialize test accounts

    alice.secret = 0xabcn;
    alice.wallet = await createWallet(alice.secret);
    alice.contract = game_master.contract.withWallet(alice.wallet);

    bob.secret = 0xdefn;
    bob.wallet = await createWallet(bob.secret);
    bob.contract = game_master.contract.withWallet(bob.wallet);
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
    ).rejects.toThrow(
      "Assertion failed: method callable only by registered player accounts",
    );
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
      bob.contract.methods
        .view_event_info(
          bob.wallet.getAddress(),
          bob.wallet.getCompleteAddress().publicKeys.masterNullifierPublicKey.hash(),
        )
        .simulate(),
    ).rejects.toThrow(
      "Assertion failed: method callable only by registered player accounts",
    );
  });

  it("fails when an un-registered account tries to read the event info note of a registered account", () => {
    expect(
      bob.contract.methods
        .view_event_info(
          alice.wallet.getAddress(),
          bob.wallet.getCompleteAddress().publicKeys.masterNullifierPublicKey.hash(),
        )
        .simulate(),
    ).rejects.toThrow("not allowed");
  });

  it(
    "reads the event info note when the called by the corresponding registered account",
    async () => {
      const gameMasterEpochCount = await game_master.contract.methods
        .view_epoch_count()
        .simulate();

      const tx = await alice.contract.methods
        .view_event_info(
          alice.wallet.getAddress(),
          alice.wallet.getCompleteAddress().publicKeys.masterNullifierPublicKey.hash(),
        )
        .simulate();

      expect(tx.value).toBe(gameMasterEpochCount);
    },
    timeout,
  );

  it(
    "fails when a registered account tries to read event info note of a different registered account",
    async () => {
      await bob.contract.methods.register(stringToBigInt("bob")).send().wait();

      await game_master.contract.methods
        .create_event_info_note(bob.wallet.getAddress())
        .send()
        .wait();

      // bob tries to read alice's secret
      expect(
        bob.contract.methods
          .view_event_info(
            alice.wallet.getAddress(),
            bob.wallet.getCompleteAddress().publicKeys.masterNullifierPublicKey.hash(),
          )
          .simulate(),
      ).rejects.toThrow("not allowed");

      // alice tries to read bob's secret
      expect(
        alice.contract.methods
          .view_event_info(
            bob.wallet.getAddress(),
            alice.wallet
              .getCompleteAddress()
              .publicKeys.masterNullifierPublicKey.hash(),
          )
          .simulate(),
      ).rejects.toThrow("not allowed");
    },
    timeout,
  );
});
