import { assert } from "console";
import { beforeAll, describe, expect, test } from "bun:test";

import { GAME_MASTER, ACCOUNTS, registerAccounts } from "./accounts";
import { deploy_contract } from "./gateway_contract";
import { stringToBigInt } from "common/utils/bigint";

describe("Battle Froglins", () => {
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

    const [stashAlice, stashBob] = await Promise.all([
      ACCOUNTS.alice.contracts.gateway.methods
        .view_stash(ACCOUNTS.alice.wallet.getAddress())
        .simulate(),
      ACCOUNTS.bob.contracts.gateway.methods
        .view_stash(ACCOUNTS.bob.wallet.getAddress())
        .simulate(),
    ]);

    assert(stashAlice[1] == 1n);
    assert(stashBob[2] == 1n);

    console.log("\nRunning tests...\n");
  });

  // test(
  //   "compare choices 1",
  //   async () => {
  //     const result = await GAME_MASTER.contracts.gateway.methods
  //       .compare_battle_choices(123, 111) // draw
  //       .simulate();
  //     expect(result).toEqual(3n);
  //   },
  //   timeout,
  // );

  // test(
  //   "compare choices 2",
  //   async () => {
  //     const result = await GAME_MASTER.contracts.gateway.methods
  //       .compare_battle_choices(111, 111) // draw
  //       .simulate();
  //     expect(result).toEqual(3n);
  //   },
  //   timeout,
  // );

  // test(
  //   "compare choices 3",
  //   async () => {
  //     const result = await GAME_MASTER.contracts.gateway.methods
  //       .compare_battle_choices(322, 111) // 1 wins
  //       .simulate();
  //     expect(result).toEqual(1n);
  //   },
  //   timeout,
  // );
  // test(
  //   "compare choices 4",
  //   async () => {
  //     const result = await GAME_MASTER.contracts.gateway.methods
  //       .compare_battle_choices(121, 311) // 1 wins
  //       .simulate();
  //     expect(result).toEqual(1n);
  //   },
  //   timeout,
  // );
  // test(
  //   "compare choices 5",
  //   async () => {
  //     const result = await GAME_MASTER.contracts.gateway.methods
  //       .compare_battle_choices(311, 112) // 2 wins
  //       .simulate();
  //     expect(result).toEqual(2n);
  //   },
  //   timeout,
  // );

  test(
    "alice creates battle proposal",
    async () => {
      await ACCOUNTS.alice.contracts.gateway.methods
        .create_battle_proposal(1, 2, 121)
        .send()
        .wait();

      const proposal = await ACCOUNTS.alice.contracts.gateway.methods
        .view_battle_proposal(0)
        .simulate();

      expect(proposal.status).toBe(1n);
      console.log("Battle proposal created");
    },
    timeout,
  );

  test(
    "bob accepts battle proposal",
    async () => {
      await ACCOUNTS.bob.contracts.gateway.methods
        .accept_battle_proposal(0, 313)
        .send()
        .wait();

      const proposal = await ACCOUNTS.alice.contracts.gateway.methods
        .view_battle_proposal(0)
        .simulate();

      expect(proposal.status).toBe(2n);
      console.log("Battle proposal accepted");
    },
    timeout,
  );

  test(
    "make battle",
    async () => {
      await GAME_MASTER.contracts.gateway.methods.make_battle(0).send().wait();
      console.log("Battle logic resolved");

      const proposal = await ACCOUNTS.alice.contracts.gateway.methods
        .view_battle_proposal(0)
        .simulate();
      console.log("proposal", proposal);

      const wonInBattle = await ACCOUNTS.alice.contracts.gateway.methods
        .view_won_in_battle(ACCOUNTS.alice.wallet.getAddress())
        .simulate();
      expect(wonInBattle[0].froglin_won).toEqual(2n);
    },
    timeout,
  );

  test(
    "return Froglin from battle",
    async () => {
      await ACCOUNTS.alice.contracts.gateway.methods.claim_winnings(2).send().wait();
      const stashAlice = await ACCOUNTS.alice.contracts.gateway.methods
        .view_stash(ACCOUNTS.alice.wallet.getAddress())
        .simulate();
      console.log("stashAlice", stashAlice);
      expect(stashAlice[1]).toEqual(1n);
    },
    timeout,
  );
});
