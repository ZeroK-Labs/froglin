import { assert } from "console";
import { beforeAll, describe, expect, test } from "bun:test";

import { GAME_MASTER, ACCOUNTS, registerAccounts } from "./accounts";
import { deploy_contract } from "./gateway_contract";
import { stringToBigInt } from "common/utils/bigint";

describe("Date Froglins", () => {
  const timeout = 60_000;
  const FROGLIN_COUNT = 5;
  const EPOCH_COUNT = 3;
  const EPOCH_DURATION = 20_000;

  beforeAll(async () => {
    console.log("\nSetting up test suite...\n");

    await deploy_contract([ACCOUNTS.alice, ACCOUNTS.bob]);

    console.log("Registering players...");

    const alice = stringToBigInt("alice");
    const bob = stringToBigInt("bob");

    await Promise.all([
      ACCOUNTS.alice.contracts.gateway.methods.register(alice).send().wait(),
      ACCOUNTS.bob.contracts.gateway.methods.register(bob).send().wait(),
    ]);

    await registerAccounts();

    console.log("Starting event...");

    await GAME_MASTER.contracts.gateway.methods
      .start_event(FROGLIN_COUNT, EPOCH_COUNT, EPOCH_DURATION, Date.now())
      .send()
      .wait();

    console.log("Capturing Froglins...");

    await Promise.all([
      ACCOUNTS.alice.contracts.gateway.methods.capture_froglin(0).send().wait(),
      ACCOUNTS.bob.contracts.gateway.methods.capture_froglin(6).send().wait(),
    ]);

    const [stashAlice, stashBob] = await Promise.all([
      ACCOUNTS.alice.contracts.gateway.methods
        .view_stash(ACCOUNTS.alice.wallet.getAddress())
        .simulate(),
      ACCOUNTS.bob.contracts.gateway.methods
        .view_stash(ACCOUNTS.bob.wallet.getAddress())
        .simulate(),
    ]);

    assert(stashAlice[0] == 1n);
    assert(stashBob[6] == 1n);

    console.log("\nRunning tests...\n");
  });

  test(
    "alice creates date proposal",
    async () => {
      await ACCOUNTS.alice.contracts.gateway.methods
        .create_date_proposal(0, 3)
        .send()
        .wait();

      const proposal = await ACCOUNTS.alice.contracts.gateway.methods
        .view_date_proposal(0)
        .simulate();

      expect(proposal.status).toBe(1n);
      console.log("Date proposal created");
    },
    timeout,
  );

  test(
    "bob accepts date proposal",
    async () => {
      await ACCOUNTS.bob.contracts.gateway.methods
        .accept_date_proposal(0, 6, 4)
        .send()
        .wait();

      const proposal = await ACCOUNTS.alice.contracts.gateway.methods
        .view_date_proposal(0)
        .simulate();

      expect(proposal.status).toBe(2n);
      console.log("Date proposal accepted");
    },
    timeout,
  );

  test(
    "make date",
    async () => {
      await GAME_MASTER.contracts.gateway.methods.make_date(0).send().wait();
      console.log("Date logic resolved");

      const proposal = await ACCOUNTS.alice.contracts.gateway.methods
        .view_date_proposal(0)
        .simulate();

      expect(proposal.status).toBe(4n);
    },
    timeout,
  );
});
