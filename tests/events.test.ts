import { beforeAll, describe, expect, test } from "bun:test";

import { ACCOUNTS } from "./accounts";

import { deploy_contract } from "./gateway_contract";
import { stringToBigInt } from "common/utils/bigint";

describe("Events Registration", () => {
  const timeout = 40_000;

  beforeAll(async () => {
    console.log("\nSetting up test suite...\n");

    await deploy_contract([ACCOUNTS.alice]);

    console.log("Registering players...");

    await ACCOUNTS.alice.contracts.gateway.methods
      .register(stringToBigInt("alice"))
      .send()
      .wait();

    console.log("\nRunning tests...\n");
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

      expect(events.length).toBe(5);
      expect(events[0]).toBe(event_name);
      expect(events[1]).toBe(0n);
      expect(events[2]).toBe(0n);
      expect(events[3]).toBe(0n);
      expect(events[4]).toBe(0n);
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

      expect(events.length).toBe(5);
      expect(events[0]).toBe(0n);
      expect(events[1]).toBe(0n);
      expect(events[2]).toBe(0n);
      expect(events[3]).toBe(0n);
      expect(events[4]).toBe(0n);
    },
    timeout,
  );
});
