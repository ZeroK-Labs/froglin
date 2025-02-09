import "common/loadenv.js";

import { afterAll, beforeAll } from "bun:test";

import { createAccounts, destroyAccounts } from "./accounts";

beforeAll(async () => {
  console.log("\nSetting up tests...\n");

  await createAccounts();

  console.log("\nTests setup completed \x1b[32msucessfully\x1b[0m");
});

afterAll(destroyAccounts);
