import "./prepare";

import cors from "cors";
import express from "express";
import fs from "fs";
import https from "https";
import path from "path";
import { execSync } from "child_process";

import { addSandboxWatcherEventHandler, startSandboxWatcher } from "./SandboxWatcher";
import { createAccount } from "./aztec";
import { createSocketServer, destroySocketServer } from "./sockets";
import { getGame } from "./endpoints/game";
import { getGatewayAddress } from "./endpoints/gateway";
import { getLeaderboard } from "./endpoints/leaderboard";
import { revealFroglins } from "./endpoints/reveal";

// graceful shutdown on Ctrl+C
function cleanup() {
  console.log("Shutting down...");

  destroySocketServer();

  html_server.close(() => {
    execSync(`pgrep -a -f "bun backend/start.ts" | awk '{print $1}' | xargs kill -9`, {
      stdio: "inherit",
    });
  });
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

const app = express();

// CONFIGURATION
app.use(cors());
app.use(express.json());

// ENDPOINTS
app.get("/gateway", getGatewayAddress);
app.get("/game", getGame);
app.get("/leaderboard", getLeaderboard);

app.post("/reveal", revealFroglins);

// HTML SERVER
const options = {
  key: fs.readFileSync(path.resolve(process.env.SSL_KEY!)),
  cert: fs.readFileSync(path.resolve(process.env.SSL_CERT!)),
};

let html_server: https.Server;

async function handleSandboxFound() {
  try {
    await createAccount();
    //
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    return;
  }

  html_server = https.createServer(options, app);
  createSocketServer({ server: html_server });

  // START
  html_server.listen(Number(process.env.BACKEND_PORT), () => {
    console.log(
      `\nWebserver is \x1b[32mlive\x1b[0m @ \x1b[1m\x1b[34mhttps\x1b[0m\x1b[0m://localhost:${process.env.BACKEND_PORT}\x1b[0m\n`,
    );
  });
}

function handleSandboxLost() {
  console.log("\nSandbox lost, shutting down\n");

  destroySocketServer();
  if (html_server) html_server.close();
}

addSandboxWatcherEventHandler("found", handleSandboxFound);
addSandboxWatcherEventHandler("lost", handleSandboxLost);

startSandboxWatcher();
