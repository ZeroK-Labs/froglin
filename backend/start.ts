import "./prepare";

import cors from "cors";
import express from "express";
import fs from "fs";
import https from "https";
import path from "path";

import { getGame } from "./endpoints/game";
import { getLeaderboard } from "./endpoints/leaderboard";
import { createSocketServer, destroySocketServer } from "./sockets";

const app = express();

// apply cors
app.use(cors());

// endpoints
app.get("/game", getGame);
app.get("/leaderboard", getLeaderboard);

// SSL certificates
const certPath = path.resolve("certificates/localhost-cert.pem");
const keyPath = path.resolve("certificates/localhost-key.pem");

const options = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};

// HTML SERVER
const html_server = https.createServer(options, app);

html_server.listen(Number(process.env.BACKEND_PORT), () => {
  console.log(
    `Webserver is \x1b[32mlive\x1b[0m @ \x1b[1m\x1b[34mhttps\x1b[0m\x1b[0m://localhost:${process.env.BACKEND_PORT}\x1b[0m\n`,
  );
});

createSocketServer({ server: html_server });

// graceful shutdown on Ctrl+C
process.on("SIGINT", () => {
  console.log("Shutting down...");

  destroySocketServer();

  html_server.close(() => {
    console.log("HTTP server closed");
  });
});
