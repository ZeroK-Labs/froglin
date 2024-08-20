import type { AccountWallet } from "@aztec/aztec.js";
import { beforeAll, describe, expect, test } from "bun:test";

import { EVENT } from "frontend/settings";
import { FroglinEventContract } from "aztec/contracts/event/artifact/FroglinEvent";
import { GAME_MASTER, ACCOUNTS } from "./accounts";
import { createWallet } from "common/utils/WalletManager";

describe("EventInfo Tests", () => {
  const timeout = 60_000;

  let EVENT_DUMMY_WALLET__GAME_MASTER: AccountWallet;
  let EVENT_DUMMY_WALLET__ALICE: AccountWallet;

  beforeAll(async () => {
    console.log("Creating shared account...");

    EVENT_DUMMY_WALLET__GAME_MASTER = await createWallet("101", GAME_MASTER.pxe);
    EVENT_DUMMY_WALLET__ALICE = await createWallet("101", ACCOUNTS.alice.pxe);

    // let promises: Promise<any>[] = [
    // ];
    // await Promise.all(promises);

    console.log("Deploying contract...");

    GAME_MASTER.contracts.event = await FroglinEventContract.deploy(
      GAME_MASTER.wallet,
      EVENT_DUMMY_WALLET__GAME_MASTER.getAddress(),
      0,
      0,
      EVENT.EPOCH_COUNT,
      EVENT.EPOCH_DURATION,
      Date.now(),
    )
      .send()
      .deployed();

    expect(GAME_MASTER.contracts.event.instance).not.toBeNull();

    await ACCOUNTS.alice.pxe.registerContract({
      instance: GAME_MASTER.contracts.event.instance,
      artifact: GAME_MASTER.contracts.event.artifact,
    });

    ACCOUNTS.alice.contracts.event = GAME_MASTER.contracts.event.withWallet(
      ACCOUNTS.alice.wallet,
    );

    console.log("Running tests...");
  });

  test(
    "can update epoch for dummy player",
    async () => {
      const epoch_start_time = Date.now();

      const action =
        GAME_MASTER.contracts.event!.methods.advance_epoch(epoch_start_time);

      const witness = await EVENT_DUMMY_WALLET__GAME_MASTER.createAuthWit({
        caller: GAME_MASTER.wallet.getAddress(),
        action,
      });
      await GAME_MASTER.wallet.addAuthWitness(witness);
      // expect(
      //   await EVENT_DUMMY_WALLET__GAME_MASTER.lookupValidity(
      //     EVENT_DUMMY_WALLET__GAME_MASTER.getAddress(),
      //     {
      //       caller: GAME_MASTER.wallet.getAddress(),
      //       action,
      //     },
      //   ),
      // ).toEqual({
      //   isValidInPrivate: true,
      //   isValidInPublic: false,
      // });

      await action.send().wait();

      let tx = await GAME_MASTER.contracts
        .event!.methods.view_event_info_owner()
        .simulate();

      console.log(tx);

      tx = await ACCOUNTS.alice.contracts
        .event!.withWallet(EVENT_DUMMY_WALLET__ALICE)
        .methods.view_event_info()
        .simulate();

      console.log(tx);
    },
    timeout,
  );
});
