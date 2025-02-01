import { beforeAll, describe, expect, test } from "bun:test";

import { FroglinGatewayContract } from "aztec/contracts/gateway/artifact/FroglinGateway";
import { GAME_MASTER, ACCOUNTS } from "./accounts";
import { stringToBigInt } from "common/utils/bigint";

describe("Registration", () => {
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

    await ACCOUNTS.alice.contracts.gateway.methods
      .register(stringToBigInt("alice"))
      .send()
      .wait();
  });

  test(
    "registered player can join event",
    async () => {
      const event_name = stringToBigInt("event1");

      await ACCOUNTS.alice.contracts.gateway.methods
        .join_event(event_name)
        .send()
        .wait();

      const events = await ACCOUNTS.alice.contracts.gateway.methods
        .view_events(ACCOUNTS.alice.wallet.getAddress())
        .simulate();

      expect(events.length).toBe(4);
      expect(events[0]).toBe(event_name);
      expect(events[1]).toBe(0n);
      expect(events[2]).toBe(0n);
      expect(events[3]).toBe(0n);
    },
    timeout,
  );

  test(
    "registered player can leave event",
    async () => {
      const event_name = stringToBigInt("event1");

      await ACCOUNTS.alice.contracts.gateway.methods
        .leave_event(event_name)
        .send()
        .wait();

      const events = await ACCOUNTS.alice.contracts.gateway.methods
        .view_events(ACCOUNTS.alice.wallet.getAddress())
        .simulate();

      expect(events.length).toBe(4);
      expect(events[0]).toBe(0n);
      expect(events[1]).toBe(0n);
      expect(events[2]).toBe(0n);
      expect(events[3]).toBe(0n);
    },
    timeout,
  );
});
