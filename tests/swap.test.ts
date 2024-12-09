import { Fr } from "@aztec/aztec.js";
import { assert } from "console";
import { beforeAll, describe, expect, test } from "bun:test";

import { FroglinGatewayContract } from "aztec/contracts/gateway/artifact/FroglinGateway";
import { GAME_MASTER, ACCOUNTS } from "./accounts";
import { stringToBigInt } from "common/utils/bigint";

describe("Swap Froglin", () => {
  const timeout = 60_000;
  const FROGLIN_COUNT = 5;
  const EPOCH_COUNT = 3;
  const EPOCH_DURATION = 20_000;

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
    ];
    await Promise.all(promises);

    // create a contract instance per wallet
    ACCOUNTS.alice.contracts.gateway = GAME_MASTER.contracts.gateway.withWallet(
      ACCOUNTS.alice.wallet,
    );
    ACCOUNTS.bob.contracts.gateway = GAME_MASTER.contracts.gateway.withWallet(
      ACCOUNTS.bob.wallet,
    );

    console.log("Registering accounts...");

    const alice = stringToBigInt("alice");
    const bob = stringToBigInt("bob");

    promises = [
      ACCOUNTS.alice.contracts.gateway.methods.register(alice).send().wait(),
      ACCOUNTS.bob.contracts.gateway.methods.register(bob).send().wait(),
    ];

    await Promise.all(promises);

    promises = [
      ACCOUNTS.bob.pxe.registerAccount(
        new Fr(BigInt(ACCOUNTS.alice.secret)),
        ACCOUNTS.alice.wallet.getCompleteAddress().partialAddress,
      ),
      ACCOUNTS.alice.pxe.registerAccount(
        new Fr(BigInt(ACCOUNTS.bob.secret)),
        ACCOUNTS.bob.wallet.getCompleteAddress().partialAddress,
      ),
    ];
    await Promise.all(promises);

    // // register player accounts in deployment account PXE for note emission
    // promises = [
    //   GAME_MASTER.pxe.registerAccount(
    //     new Fr(BigInt(ACCOUNTS.alice.secret)),
    //     ACCOUNTS.alice.wallet.getCompleteAddress().partialAddress,
    //   ),
    //   GAME_MASTER.pxe.registerAccount(
    //     new Fr(BigInt(ACCOUNTS.bob.secret)),
    //     ACCOUNTS.bob.wallet.getCompleteAddress().partialAddress,
    //   ),
    //   ACCOUNTS.alice.pxe.registerAccount(
    //     new Fr(BigInt(ACCOUNTS.bob.secret)),
    //     ACCOUNTS.bob.wallet.getCompleteAddress().partialAddress,
    //   ),
    //   ACCOUNTS.bob.pxe.registerAccount(
    //     new Fr(BigInt(ACCOUNTS.alice.secret)),
    //     ACCOUNTS.alice.wallet.getCompleteAddress().partialAddress,
    //   ),
    //   // ACCOUNTS.bob.pxe.registerRecipient(ACCOUNTS.alice.wallet.getCompleteAddress()),
    //   // ACCOUNTS.alice.pxe.registerRecipient(ACCOUNTS.bob.wallet.getCompleteAddress()),
    // ];
    // await Promise.all(promises);

    console.log("Starting event...");

    await GAME_MASTER.contracts.gateway.methods
      .start_event(FROGLIN_COUNT, EPOCH_COUNT, EPOCH_DURATION, Date.now())
      .send()
      .wait();

    console.log("Capturing Froglins...");

    promises = [
      ACCOUNTS.alice.contracts.gateway.methods.capture_froglin(1).send().wait(),
      ACCOUNTS.bob.contracts.gateway.methods.capture_froglin(2).send().wait(),
    ];
    await Promise.all(promises);

    const stashAlice = await ACCOUNTS.alice.contracts.gateway.methods
      .view_stash(ACCOUNTS.alice.wallet.getAddress())
      .simulate();
    assert(stashAlice[1] == 1n);

    const stashBob = await ACCOUNTS.bob.contracts.gateway.methods
      .view_stash(ACCOUNTS.bob.wallet.getAddress())
      .simulate();
    assert(stashBob[2] == 1n);
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
