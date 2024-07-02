import { beforeAll, describe, expect, it } from "bun:test";
import { Fr } from "@aztec/aztec.js";

import { FroglinContract } from "contracts/artifacts/Froglin";
import { AccountWithContract, createWallet, stringToBigInt } from "./utils";

describe("Registration Tests", () => {
  const timeout = 40_000;

  let game_master = {} as AccountWithContract;
  let alice = {} as AccountWithContract;
  let bob = {} as AccountWithContract;
  let charlie = {} as AccountWithContract;

  beforeAll(async () => {
    // initialize deployment account

    game_master.secret = 0x123n;
    game_master.wallet = await createWallet(game_master.secret);

    // deploy contract

    game_master.contract = await FroglinContract.deploy(game_master.wallet)
      .send({ contractAddressSalt: Fr.random() })
      .deployed();

    expect(game_master.contract).not.toBeNull();
    expect(game_master.contract.address).not.toBeNull();
    expect(game_master.contract.address.toString().substring(0, 2)).toBe("0x");

    // initialize test accounts

    alice.secret = 0xabcn;
    alice.wallet = await createWallet(alice.secret);
    alice.contract = game_master.contract.withWallet(alice.wallet);

    bob.secret = 0xdefn;
    bob.wallet = await createWallet(bob.secret);
    bob.contract = game_master.contract.withWallet(bob.wallet);

    charlie.secret = 0xabcdefn;
    charlie.wallet = await createWallet(charlie.secret);
    charlie.contract = game_master.contract.withWallet(charlie.wallet);
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
    ).rejects.toThrow(
      "Assertion failed: method callable only by registered player accounts",
    );
  });

  it("fails when an un-registered account tries to read the name of a registered account", () => {
    expect(
      bob.contract.methods.view_name(alice.wallet.getAddress()).simulate(),
    ).rejects.toThrow("Failed to solve brillig function 'self._is_some'");
  });

  it(
    "fails when a registered account tries to read the name of a different registered account",
    async () => {
      const nameAsField = stringToBigInt("charlie");

      await charlie.contract.methods.register(nameAsField).send().wait();

      expect(
        charlie.contract.methods.view_name(alice.wallet.getAddress()).simulate(),
      ).rejects.toThrow("Failed to solve brillig function 'self._is_some'");
    },
    timeout,
  );

  it("fails when an un-registered account tries to update its name in the registry", () => {
    const nameAsField = stringToBigInt("bob in wonderland");

    expect(bob.contract.methods.update_name(nameAsField).send().wait()).rejects.toThrow(
      "Failed to solve brillig function 'self._is_some'",
    );
  });
});
