import path from "path";
import fs from "fs";

// Function to load settings dynamically based on the mode
async function loadSettingsFile(mode = "dev") {
  // Determine the settings file to use
  const settingsFile = mode === "dev" ? "dev.js" : "prod.js";
  const settingsPath = path.resolve(`settings/${settingsFile}`);

  if (!fs.existsSync(settingsPath)) {
    throw new Error(`Error loading environment: missing file ${settingsPath}`);
  }

  const settings = await import(settingsPath);
  return settings.default;
}

export default async (mode = "dev") => {
  const settings = await loadSettingsFile(mode);
  for (const key in settings) {
    process.env[key] = settings[key];
  }

  process.env.NODE_ENV = mode === "dev" ? "development" : "production";

  process.env.SANDBOX_ROOT =
    settings.SANDBOX_HOST === "localhost"
      ? `http://localhost:`
      : `https://${settings.SANDBOX_HOST}/pxe/`;

  process.env.SANDBOX_URL = process.env.SANDBOX_ROOT + settings.SANDBOX_PORT;

  process.env.BACKEND_URL =
    process.env.BACKEND_PROTOCOL +
    "://" +
    process.env.BACKEND_HOST +
    ":" +
    process.env.BACKEND_PORT;

  process.env.WSS_URL = `wss://${process.env.BACKEND_HOST}:${process.env.BACKEND_PORT}`;

  console.log(`\n\x1b[32m${process.env.NODE_ENV}\x1b[0m mode\n`);
};
