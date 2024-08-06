import "common/loadenv.js";

import { afterAll, beforeAll } from "bun:test";

import { createAccounts, destroyAccounts } from "./accounts";

beforeAll(createAccounts);
afterAll(destroyAccounts);
