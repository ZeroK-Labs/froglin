import dotenv from "dotenv";
import fs from "fs";

export default (mode = "dev") => {
  // determine the environment file to use
  const envFile = mode === "dev" ? ".env/dev" : ".env/prod";

  if (fs.existsSync(envFile)) dotenv.config({ path: envFile });
  else throw `Missing required file '${envFile}' while preparing environment`;

  process.env.NODE_ENV = mode === "dev" ? "development" : "production";

  process.env.SANDBOX_URL =
    process.env.SANDBOX_PROTOCOL +
    "://" +
    process.env.SANDBOX_HOST +
    ":" +
    process.env.SANDBOX_PORT;

  process.env.BACKEND_URL =
    process.env.BACKEND_PROTOCOL +
    "://" +
    process.env.BACKEND_HOST +
    ":" +
    process.env.BACKEND_PORT;

  process.env.WSS_URL = `wss://${process.env.BACKEND_HOST}:${process.env.BACKEND_PORT}`;

  console.log(`\n\x1b[32m${process.env.NODE_ENV}\x1b[0m mode\n`);
};
