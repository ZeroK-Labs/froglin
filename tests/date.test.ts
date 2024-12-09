import { beforeAll, describe, expect, test } from "bun:test";
// import { type IntentAction } from "node_modules/@aztec/aztec.js/dest/utils/authwit";
import { Fr } from "@aztec/aztec.js";
import { assert } from "console";

import { FroglinGatewayContract } from "aztec/contracts/gateway/artifact/FroglinGateway";
import { GAME_MASTER, ACCOUNTS } from "./accounts";
import { stringToBigInt } from "common/utils/bigint";

describe("Date Froglins", () => {
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

    console.log("Registering pxes...");
    promises = [
      ACCOUNTS.bob.pxe.registerAccount(
        new Fr(BigInt(ACCOUNTS.alice.secret)),
        ACCOUNTS.alice.wallet.getCompleteAddress().partialAddress,
      ),
      ACCOUNTS.alice.pxe.registerAccount(
        new Fr(BigInt(ACCOUNTS.bob.secret)),
        ACCOUNTS.bob.wallet.getCompleteAddress().partialAddress,
      ),
      ACCOUNTS.bob.pxe.registerAccount(
        new Fr(BigInt(GAME_MASTER.secret)),
        GAME_MASTER.wallet.getCompleteAddress().partialAddress,
      ),
      ACCOUNTS.alice.pxe.registerAccount(
        new Fr(BigInt(GAME_MASTER.secret)),
        GAME_MASTER.wallet.getCompleteAddress().partialAddress,
      ),
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

    console.log("Starting event...");

    await GAME_MASTER.contracts.gateway.methods
      .start_event(FROGLIN_COUNT, EPOCH_COUNT, EPOCH_DURATION, Date.now())
      .send()
      .wait();

    console.log("Capturing Froglins...");

    promises = [
      ACCOUNTS.alice.contracts.gateway.methods.capture_froglin(0).send().wait(),
      ACCOUNTS.bob.contracts.gateway.methods.capture_froglin(6).send().wait(),
    ];
    await Promise.all(promises);

    const stashAlice = await ACCOUNTS.alice.contracts.gateway.methods
      .view_stash(ACCOUNTS.alice.wallet.getAddress())
      .simulate();
    assert(stashAlice[0] == 1n);

    const stashBob = await ACCOUNTS.bob.contracts.gateway.methods
      .view_stash(ACCOUNTS.bob.wallet.getAddress())
      .simulate();
    assert(stashBob[6] == 1n);
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

      expect(proposal.status).toBe(3n);
    },
    timeout,
  );
});
