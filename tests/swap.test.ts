import { beforeAll, describe, expect, test } from "bun:test";
// import { type IntentAction } from "node_modules/@aztec/aztec.js/dest/utils/authwit";
import { Fr } from "@aztec/aztec.js";

import { FroglinGatewayContract } from "aztec/contracts/gateway/artifact/FroglinGateway";
import { GAME_MASTER, ACCOUNTS } from "./accounts";
import { stringToBigInt } from "common/utils/bigint";
// import { assert } from "console";

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
    // 0x0f92414ca79636330ef64ccf906ba27a7e4b323cf984945695e3f189b662bfd0
    expect(GAME_MASTER.contracts.gateway).not.toBeNull();
    console.log("Contract deployed at", GAME_MASTER.contracts.gateway.address);
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
  });
  // test(
  //   "transfer froglin",
  //   async () => {
  //     await GAME_MASTER.contracts.gateway.methods
  //       .start_event(FROGLIN_COUNT, EPOCH_COUNT, EPOCH_DURATION, Date.now())
  //       .send()
  //       .wait();

  //     await ACCOUNTS.alice.contracts.gateway.methods.capture_froglin(0).send().wait();
  //     await ACCOUNTS.alice.contracts.gateway.methods
  //       .transfer(ACCOUNTS.bob.wallet.getAddress(), 0)
  //       .send()
  //       .wait();

  //     const stash = await ACCOUNTS.alice.contracts.gateway.methods
  //       .view_stash(ACCOUNTS.alice.wallet.getAddress())
  //       .simulate();
  //     console.log("stassh", stash);
  //     expect(stash[0]).toEqual(0n);
  //     await ACCOUNTS.bob.contracts.gateway.methods.claim_froglin().send().wait();
  //     const stashBob = await ACCOUNTS.bob.contracts.gateway.methods
  //       .view_stash(ACCOUNTS.bob.wallet.getAddress())
  //       .simulate();
  //     console.log("stasshBob", stashBob);
  //   },
  //   timeout,
  // );
  test(
    "player cannot create offer with froglin he does not own",
    async () => {
      await GAME_MASTER.contracts.gateway.methods
        .start_event(FROGLIN_COUNT, EPOCH_COUNT, EPOCH_DURATION, Date.now())
        .send()
        .wait();

      await expect(
        ACCOUNTS.alice.contracts.gateway.methods
          .create_swap_proposal(1, 2)
          .send()
          .wait(),
      ).rejects.toThrowError("player does not have the offered froglin type");
    },
    timeout,
  );

  test(
    "create swap offer",
    async () => {
      // await GAME_MASTER.contracts.gateway.methods
      //   .start_event(FROGLIN_COUNT, EPOCH_COUNT, EPOCH_DURATION, Date.now())
      //   .send()
      //   .wait();

      await ACCOUNTS.alice.contracts.gateway.methods.capture_froglin(1).send().wait();
      await ACCOUNTS.bob.contracts.gateway.methods.capture_froglin(2).send().wait();

      const stash1Bob = await ACCOUNTS.bob.contracts.gateway.methods
        .view_stash(ACCOUNTS.bob.wallet.getAddress())
        .simulate();
      const stash1Alice = await ACCOUNTS.alice.contracts.gateway.methods
        .view_stash(ACCOUNTS.alice.wallet.getAddress())
        .simulate();
      console.log("stassh1111Bob", stash1Bob);
      console.log("stassh1111Alice", stash1Alice);

      await ACCOUNTS.alice.contracts.gateway.methods
        .create_swap_proposal(1, 2)
        .send()
        .wait();

      const swaps = await ACCOUNTS.bob.contracts.gateway.methods
        .view_active_swap_proposals()
        .simulate();
      console.log("swaps", swaps[0]);
      await ACCOUNTS.bob.contracts.gateway.methods
        .accept_swap_proposal(0)
        .send()
        .wait();

      await ACCOUNTS.alice.contracts.gateway.methods
        .claim_swap_proposal(0)
        .send()
        .wait();

      const stashBob = await ACCOUNTS.bob.contracts.gateway.methods
        .view_stash(ACCOUNTS.bob.wallet.getAddress())
        .simulate();
      const stashAlice = await ACCOUNTS.alice.contracts.gateway.methods
        .view_stash(ACCOUNTS.alice.wallet.getAddress())
        .simulate();
      console.log("stasshBob", stashBob);
      console.log("stasshAlice", stashAlice);
      // const allSwaps = await ACCOUNTS.bob.contracts.gateway.methods
      //   .view_all_proposals()
      //   .simulate();
      // console.log("allSwaps", allSwaps);
    },
    timeout,
  );

  // test(
  //   "registered account can authorize another account to call increment_froglin",
  //   async () => {
  //     await GAME_MASTER.contracts.gateway.methods
  //       .start_event(FROGLIN_COUNT, EPOCH_COUNT, EPOCH_DURATION, Date.now())
  //       .send()
  //       .wait();

  //     console.log("alice", ACCOUNTS.alice.wallet.getAddress().toString());
  //     console.log("bob", ACCOUNTS.bob.wallet.getAddress().toString());

  //     const action = ACCOUNTS.bob.contracts.gateway.methods.increment_froglin(
  //       1,
  //       ACCOUNTS.alice.wallet.getAddress(),
  //     );

  //     const intent: IntentAction = {
  //       caller: ACCOUNTS.bob.wallet.getAddress(),
  //       action,
  //     };
  //     const witness = await ACCOUNTS.alice.wallet.createAuthWit(intent);
  //     await ACCOUNTS.bob.wallet.addAuthWitness(witness);

  //     // expect(
  //     //   await ACCOUNTS.alice.wallet.lookupValidity(
  //     //     ACCOUNTS.alice.wallet.getAddress(),
  //     //     intent,
  //     //   ),
  //     // ).toEqual({
  //     //   isValidInPrivate: true,
  //     //   isValidInPublic: false,
  //     // });

  //     ACCOUNTS.bob.wallet.setScopes([
  //       ACCOUNTS.bob.wallet.getAddress(),
  //       ACCOUNTS.alice.wallet.getAddress(),
  //     ]);
  //     // ACCOUNTS.alice.wallet.setScopes([
  //     //   ACCOUNTS.bob.wallet.getAddress(),
  //     //   ACCOUNTS.alice.wallet.getAddress(),
  //     // ]);

  //     await action.send().wait();

  //     const stash = await ACCOUNTS.alice.contracts.gateway.methods
  //       .view_stash(ACCOUNTS.alice.wallet.getAddress())
  //       .simulate();
  //     expect(stash[1]).toEqual(1n);
  //   },
  //   timeout,
  // );
});
