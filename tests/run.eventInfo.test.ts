import { beforeAll, describe, expect, test } from "bun:test";
import { Fr } from "@aztec/aztec.js";

import AccountWithContracts from "common/types/AccountWithContracts";
import { FroglinEventContract } from "aztec/contracts/event/artifact/FroglinEvent";
import { FroglinGatewayContract } from "aztec/contracts/gateway/artifact/FroglinGateway";
import { getDeploymentAccount, getPlayerAccount } from "./accounts";
import { stringToBigInt } from "common/utils/bigint";

describe("EventInfo Tests", () => {
  const timeout = 60_000;

  let game_master: AccountWithContracts;
  let alice: AccountWithContracts;
  let bob: AccountWithContracts;

  beforeAll(async () => {
    game_master = await getDeploymentAccount();
    alice = await getPlayerAccount("alice");
    bob = await getPlayerAccount("bob");

    game_master.contracts.gateway = await FroglinGatewayContract.deploy(
      game_master.wallet,
    )
      .send()
      .deployed();

    expect(game_master.contracts.gateway.instance).not.toBeNull();

    game_master.contracts.event = await FroglinEventContract.deploy(
      game_master.wallet,
      game_master.contracts.gateway.address,
    )
      .send()
      .deployed();

    expect(game_master.contracts.event.instance).not.toBeNull();

    // register deployed contract in each PXE
    let promises: Promise<any>[] = [
      alice.pxe.registerContract({
        instance: game_master.contracts.gateway.instance,
        artifact: game_master.contracts.gateway.artifact,
      }),
      alice.pxe.registerContract({
        instance: game_master.contracts.event.instance,
        artifact: game_master.contracts.event.artifact,
      }),

      bob.pxe.registerContract({
        instance: game_master.contracts.gateway.instance,
        artifact: game_master.contracts.gateway.artifact,
      }),
      bob.pxe.registerContract({
        instance: game_master.contracts.event.instance,
        artifact: game_master.contracts.event.artifact,
      }),
    ];
    await Promise.all(promises);

    // create contract instances per wallet
    alice.contracts.gateway = game_master.contracts.gateway.withWallet(alice.wallet);
    alice.contracts.event = game_master.contracts.event.withWallet(alice.wallet);

    bob.contracts.gateway = game_master.contracts.gateway.withWallet(bob.wallet);
    bob.contracts.event = game_master.contracts.event.withWallet(bob.wallet);

    // register player accounts in deployment account PXE for note emission
    promises = [
      game_master.pxe.registerAccount(
        new Fr(BigInt(alice.secret)),
        alice.wallet.getCompleteAddress().partialAddress,
      ),
      game_master.pxe.registerAccount(
        new Fr(BigInt(bob.secret)),
        bob.wallet.getCompleteAddress().partialAddress,
      ),
    ];
    await Promise.all(promises);
  });

  test("fails when non-owner account tries to create event info note", () => {
    expect(
      alice.contracts
        .event!.methods.create_event_info_note(alice.wallet.getAddress())
        .send()
        .wait(),
    ).rejects.toThrow("Assertion failed: method callable only by owner");
  });

  test("fails when owner tries to create event info note for an un-registered account", () => {
    expect(
      game_master.contracts
        .event!.methods.create_event_info_note(bob.wallet.getAddress())
        .send()
        .wait(),
    ).rejects.toThrow("Assertion failed: method callable only by registered players");
  });

  test(
    "creates event info note when called by owner for a registered account",
    async () => {
      await alice.contracts.gateway.methods
        .register(stringToBigInt("alice"))
        .send()
        .wait();

      const receipt = await game_master.contracts
        .event!.methods.create_event_info_note(alice.wallet.getAddress())
        .send()
        .wait();

      expect(receipt.status as string).toBe("success");
    },
    timeout,
  );

  test("fails when an un-registered account tries to read its own event info note", () => {
    expect(
      bob.contracts.event!.methods.view_event_info(bob.wallet.getAddress()).simulate(),
    ).rejects.toThrow(
      "Assertion failed: Attempted to read past end of BoundedVec 'index < self.len'",
    );

    // TODO: fix unconstrained vs private checking of player registration
    //).rejects.toThrow("Assertion failed: method callable only by registered players");
  });

  test("fails when an un-registered account tries to read the event info note of a registered account", () => {
    expect(
      bob.contracts
        .event!.methods.view_event_info(alice.wallet.getAddress())
        .simulate(),
    ).rejects.toThrow("Assertion failed: Attempted to read past end of BoundedVec");
  });

  test(
    "reads the event info note when the called by the corresponding registered account",
    async () => {
      const gameMasterEpochCount = await game_master.contracts
        .event!.methods.view_epoch_count()
        .simulate();

      const tx = await alice.contracts
        .event!.methods.view_event_info(alice.wallet.getAddress())
        .simulate();

      expect(tx.value).toBe(gameMasterEpochCount);
    },
    timeout,
  );

  test(
    "fails when a registered account tries to read event info note belonging to a different registered account",
    async () => {
      await bob.contracts.gateway.methods.register(stringToBigInt("bob")).send().wait();

      await game_master.contracts
        .event!.methods.create_event_info_note(bob.wallet.getAddress())
        .send()
        .wait();

      // bob tries to read alice's secret
      expect(
        bob.contracts
          .event!.methods.view_event_info(alice.wallet.getAddress())
          .simulate(),
      ).rejects.toThrow("Assertion failed: Attempted to read past end of BoundedVec");

      // alice tries to read bob's secret
      expect(
        alice.contracts
          .event!.methods.view_event_info(bob.wallet.getAddress())
          .simulate(),
      ).rejects.toThrow("Assertion failed: Attempted to read past end of BoundedVec");
    },
    timeout,
  );
});
