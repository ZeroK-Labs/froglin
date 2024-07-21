import "./prepare";

import cors from "cors";
import express from "express";
import fs from "fs";
import https from "https";
import path from "path";
import { execSync } from "child_process";

import { getGame } from "./endpoints/game";
import { getLeaderboard } from "./endpoints/leaderboard";
import { createSocketServer, destroySocketServer } from "./sockets";

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

// apply cors
app.use(cors());

// endpoints
app.get("/game", getGame);
app.get("/leaderboard", getLeaderboard);

// HTML SERVER
const options = {
  key: fs.readFileSync(path.resolve(process.env.SSL_KEY!)),
  cert: fs.readFileSync(path.resolve(process.env.SSL_CERT!)),
};

const html_server = https.createServer(options, app);

html_server.listen(Number(process.env.BACKEND_PORT), () => {
  console.log(
    `Webserver is \x1b[32mlive\x1b[0m @ \x1b[1m\x1b[34mhttps\x1b[0m\x1b[0m://localhost:${process.env.BACKEND_PORT}\x1b[0m\n`,
  );
});

createSocketServer({ server: html_server });
