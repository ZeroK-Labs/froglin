import { beforeAll, describe, expect, test } from "bun:test";
import { Fr } from "@aztec/aztec.js";

import { FroglinEventContract } from "aztec/contracts/event/artifact/FroglinEvent";
import { FroglinGatewayContract } from "aztec/contracts/gateway/artifact/FroglinGateway";
import { GAME_MASTER, ACCOUNTS } from "./accounts";
import { stringToBigInt } from "common/utils/bigint";

describe("EventInfo Tests", () => {
  const timeout = 60_000;

  beforeAll(async () => {
    console.log("Deploying contracts...");

    GAME_MASTER.contracts.gateway = await FroglinGatewayContract.deploy(
      GAME_MASTER.wallet,
    )
      .send()
      .deployed();

    expect(GAME_MASTER.contracts.gateway.instance).not.toBeNull();

    GAME_MASTER.contracts.event = await FroglinEventContract.deploy(
      GAME_MASTER.wallet,
      GAME_MASTER.contracts.gateway.address,
    )
      .send()
      .deployed();

    expect(GAME_MASTER.contracts.event.instance).not.toBeNull();

    // register deployed contract in each PXE
    let promises: Promise<any>[] = [
      ACCOUNTS.alice.pxe.registerContract({
        instance: GAME_MASTER.contracts.gateway.instance,
        artifact: GAME_MASTER.contracts.gateway.artifact,
      }),
      ACCOUNTS.alice.pxe.registerContract({
        instance: GAME_MASTER.contracts.event.instance,
        artifact: GAME_MASTER.contracts.event.artifact,
      }),

      ACCOUNTS.bob.pxe.registerContract({
        instance: GAME_MASTER.contracts.gateway.instance,
        artifact: GAME_MASTER.contracts.gateway.artifact,
      }),
      ACCOUNTS.bob.pxe.registerContract({
        instance: GAME_MASTER.contracts.event.instance,
        artifact: GAME_MASTER.contracts.event.artifact,
      }),
    ];
    await Promise.all(promises);

    // create contract instances per wallet
    ACCOUNTS.alice.contracts.gateway = GAME_MASTER.contracts.gateway.withWallet(
      ACCOUNTS.alice.wallet,
    );
    ACCOUNTS.alice.contracts.event = GAME_MASTER.contracts.event.withWallet(
      ACCOUNTS.alice.wallet,
    );

    ACCOUNTS.bob.contracts.gateway = GAME_MASTER.contracts.gateway.withWallet(
      ACCOUNTS.bob.wallet,
    );
    ACCOUNTS.bob.contracts.event = GAME_MASTER.contracts.event.withWallet(
      ACCOUNTS.bob.wallet,
    );

    // register player accounts in deployment account PXE for note emission
    promises = [
      GAME_MASTER.pxe.registerAccount(
        new Fr(BigInt(ACCOUNTS.alice.secret)),
        ACCOUNTS.alice.wallet.getCompleteAddress().partialAddress,
      ),
      GAME_MASTER.pxe.registerAccount(
        new Fr(BigInt(ACCOUNTS.bob.secret)),
        ACCOUNTS.bob.wallet.getCompleteAddress().partialAddress,
      ),
    ];
    await Promise.all(promises);
  });

  test("fails when non-owner account tries to create event info note", () => {
    expect(
      ACCOUNTS.alice.contracts
        .event!.methods.create_event_info_note(ACCOUNTS.alice.wallet.getAddress())
        .send()
        .wait(),
    ).rejects.toThrow("Assertion failed: method callable only by owner");
  });

  test("fails when owner tries to create event info note for an un-registered account", () => {
    expect(
      GAME_MASTER.contracts
        .event!.methods.create_event_info_note(ACCOUNTS.bob.wallet.getAddress())
        .send()
        .wait(),
    ).rejects.toThrow("Assertion failed: method callable only by registered players");
  });

  test(
    "creates event info note when called by owner for a registered account",
    async () => {
      await ACCOUNTS.alice.contracts.gateway.methods
        .register(stringToBigInt("alice"))
        .send()
        .wait();

      const receipt = await GAME_MASTER.contracts
        .event!.methods.create_event_info_note(ACCOUNTS.alice.wallet.getAddress())
        .send()
        .wait();

      expect(receipt.status as string).toBe("success");
    },
    timeout,
  );

  test("fails when an un-registered account tries to read its own event info note", () => {
    expect(
      ACCOUNTS.bob.contracts
        .event!.methods.view_event_info(ACCOUNTS.bob.wallet.getAddress())
        .simulate(),
    ).rejects.toThrow(
      "Assertion failed: Attempted to read past end of BoundedVec 'index < self.len'",
    );

    // TODO: fix unconstrained vs private checking of player registration
    //).rejects.toThrow("Assertion failed: method callable only by registered players");
  });

  test("fails when an un-registered account tries to read the event info note of a registered account", () => {
    expect(
      ACCOUNTS.bob.contracts
        .event!.methods.view_event_info(ACCOUNTS.alice.wallet.getAddress())
        .simulate(),
    ).rejects.toThrow("Assertion failed: Attempted to read past end of BoundedVec");
  });

  test(
    "reads the event info note when the called by the corresponding registered account",
    async () => {
      const gameMasterEpochCount = await GAME_MASTER.contracts
        .event!.methods.view_epoch_count()
        .simulate();

      const tx = await ACCOUNTS.alice.contracts
        .event!.methods.view_event_info(ACCOUNTS.alice.wallet.getAddress())
        .simulate();

      expect(tx.value).toBe(gameMasterEpochCount);
    },
    timeout,
  );

  test(
    "fails when a registered account tries to read event info note belonging to a different registered account",
    async () => {
      await ACCOUNTS.bob.contracts.gateway.methods
        .register(stringToBigInt("bob"))
        .send()
        .wait();

      await GAME_MASTER.contracts
        .event!.methods.create_event_info_note(ACCOUNTS.bob.wallet.getAddress())
        .send()
        .wait();

      // bob tries to read alice's secret
      expect(
        ACCOUNTS.bob.contracts
          .event!.methods.view_event_info(ACCOUNTS.alice.wallet.getAddress())
          .simulate(),
      ).rejects.toThrow("Assertion failed: Attempted to read past end of BoundedVec");

      // alice tries to read bob's secret
      expect(
        ACCOUNTS.alice.contracts
          .event!.methods.view_event_info(ACCOUNTS.bob.wallet.getAddress())
          .simulate(),
      ).rejects.toThrow("Assertion failed: Attempted to read past end of BoundedVec");
    },
    timeout,
  );
});
