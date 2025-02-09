import { assert } from "console";
import { beforeAll, describe, expect, test } from "bun:test";

import { GAME_MASTER, ACCOUNTS, registerAccounts } from "./accounts";
import { deploy_contract } from "./gateway_contract";
import { stringToBigInt } from "common/utils/bigint";

describe("Swap Froglin", () => {
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
      ACCOUNTS.alice.contracts.gateway.methods.capture_froglin(1).send().wait(),
      ACCOUNTS.bob.contracts.gateway.methods.capture_froglin(2).send().wait(),
    ]);

    const stashAlice = await ACCOUNTS.alice.contracts.gateway.methods
      .view_stash(ACCOUNTS.alice.wallet.getAddress())
      .simulate();
    assert(stashAlice[1] == 1n);

    const stashBob = await ACCOUNTS.bob.contracts.gateway.methods
      .view_stash(ACCOUNTS.bob.wallet.getAddress())
      .simulate();
    assert(stashBob[2] == 1n);

    console.log("\nRunning tests...\n");
  });

  test(
    "fails when player tries to create an offer with a Froglin he does not own",
    () => {
      expect(
        ACCOUNTS.alice.contracts.gateway.methods
          .create_swap_proposal(0, 2)
          .send()
          .wait(),
      ).rejects.toThrowError("player does not have the offered Froglin type");
    },
    timeout,
  );

  test(
    "player can create swap offer with a Froglin he owns",
    async () => {
      await ACCOUNTS.alice.contracts.gateway.methods
        .create_swap_proposal(1, 2)
        .send()
        .wait();

      let proposal = await ACCOUNTS.alice.contracts.gateway.methods
        .view_swap_proposal(0)
        .simulate();

      expect(proposal.status).toBe(1n);
    },
    timeout,
  );

  test(
    "player can view active swap proposals",
    async () => {
      const activeProposals = await ACCOUNTS.alice.contracts.gateway.methods
        .view_active_swap_proposals()
        .simulate();

      expect(activeProposals[0].offered_froglin_type).toBe(1n);
      expect(activeProposals[0].wanted_froglin_type).toBe(2n);
      expect(activeProposals[0].status).toBe(1n);
    },
    timeout,
  );

  test(
    "player can cancel swap offer before it's accepted by counterparty",
    async () => {
      await ACCOUNTS.alice.contracts.gateway.methods
        .cancel_swap_proposal(0)
        .send()
        .wait();

      let proposal = await ACCOUNTS.alice.contracts.gateway.methods
        .view_swap_proposal(0)
        .simulate();

      expect(proposal.status).toBe(4n);
    },
    timeout,
  );

  test(
    "counterparty player can accept swap offer",
    async () => {
      // create a new proposal for alice
      await ACCOUNTS.alice.contracts.gateway.methods
        .create_swap_proposal(1, 2)
        .send()
        .wait();

      await ACCOUNTS.bob.contracts.gateway.methods
        .accept_swap_proposal(1)
        .send()
        .wait();

      let proposal = await ACCOUNTS.bob.contracts.gateway.methods
        .view_swap_proposal(1)
        .simulate();

      expect(proposal.status).toBe(2n);
    },
    timeout,
  );

  test(
    "fails when player tries to cancel swap offer after it was accepted by counterparty",
    async () => {
      expect(
        ACCOUNTS.alice.contracts.gateway.methods.cancel_swap_proposal(1).send().wait(),
      ).rejects.toThrow();

      const proposal = await ACCOUNTS.alice.contracts.gateway.methods
        .view_swap_proposal(1)
        .simulate();
      expect(proposal.status).toBe(2n);
    },
    timeout,
  );

  test(
    "player can claim swap offer",
    async () => {
      const aliceProfile = await ACCOUNTS.alice.contracts.gateway.methods
        .view_profile(ACCOUNTS.alice.wallet.getAddress())
        .simulate();
      const traderId = aliceProfile.trader_id;

      const claims = await ACCOUNTS.alice.contracts.gateway.methods
        .view_claimable_swaps(traderId)
        .simulate();
      expect(claims[1].status).toBe(2n);
      await ACCOUNTS.alice.contracts.gateway.methods
        .claim_swap_proposal(1)
        .send()
        .wait();

      const proposal = await ACCOUNTS.alice.contracts.gateway.methods
        .view_swap_proposal(1)
        .simulate();
      expect(proposal.status).toBe(4n);
    },
    timeout,
  );

  test(
    "fails when player tries to cancel swap offer after it was claimed",
    async () => {
      expect(
        ACCOUNTS.alice.contracts.gateway.methods.cancel_swap_proposal(1).send().wait(),
      ).rejects.toThrow();

      const proposal = await ACCOUNTS.alice.contracts.gateway.methods
        .view_swap_proposal(1)
        .simulate();
      expect(proposal.status).toBe(4n);
    },
    timeout,
  );
});
