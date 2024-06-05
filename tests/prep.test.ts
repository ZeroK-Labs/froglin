import { existsSync } from "fs";
import { exit } from "process";
import { spawnSync } from "child_process";

import loadenv from "../scripts/loadenv";

loadenv();

// hide filename from console output
console.log("\x1b[2A\x1b[0J\x1b[1A");

if (existsSync("contracts/artifacts/Froglin.ts")) exit(0);

// generate contracts and ABIs
const result = spawnSync("sh", ["scripts/aztec/prep.sh"], {
  stdio: "inherit",
});

if (result.error) exit(1);
if (result.status !== 0) exit(result.status);
