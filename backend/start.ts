import "common/loadenv";

import cors from "cors";
import express from "express";
import fs from "fs";
import https from "https";
import path from "path";

import { ClientSessionData } from "backend/types";
import { createAccount } from "./utils/aztec";
import { createSocketServer, destroySocketServer } from "./utils/sockets";
import {
  addSandboxWatcherEventHandler,
  startSandboxWatcher,
} from "./utils/SandboxWatcher";
import {
  getGatewayAddress,
  getGame,
  getLeaderboard,
  revealFroglins,
} from "./endpoints";

export const CLIENT_SESSION_DATA: { [key: string]: ClientSessionData } = {};

// graceful shutdown on Ctrl+C
function cleanup() {
  console.log("Shutting down...");

  destroySocketServer();

  html_server.close(() => {
    process.exit();
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

  for (const sessionId in CLIENT_SESSION_DATA) {
    CLIENT_SESSION_DATA[sessionId].GameEvent?.stop();
    delete CLIENT_SESSION_DATA[sessionId];
  }
}

addSandboxWatcherEventHandler("found", handleSandboxFound);
addSandboxWatcherEventHandler("lost", handleSandboxLost);

startSandboxWatcher();
