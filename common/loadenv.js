import fs from "fs";
import path from "path";

async function loadenv() {
  const configFilePath = path.resolve("./env.config.js");

  if (!fs.existsSync(configFilePath)) {
    throw `Error loading configuration: missing file ${configFilePath}`;
  }

  const configuration = (await import(configFilePath)).default;

  for (const key in configuration) {
    process.env[key] = configuration[key];
  }

  process.env.SANDBOX_ROOT =
    configuration.SANDBOX_HOST === "localhost"
      ? `http://localhost:`
      : `https://${configuration.SANDBOX_HOST}/pxe/`;

  process.env.SANDBOX_URL = process.env.SANDBOX_ROOT + configuration.SANDBOX_PORT;

  process.env.BACKEND_URL = `https://${process.env.BACKEND_HOST}:${process.env.BACKEND_PORT}`;

  process.env.WSS_URL = `wss://${process.env.BACKEND_HOST}:${process.env.BACKEND_PORT}`;
}

await loadenv();
