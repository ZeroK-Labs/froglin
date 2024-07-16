import cors from "cors";
import express from "express";
import fs from "fs";
import https from "https";
import path from "path";
import { getGame } from "./endpoints/game";
import { getLeaderboard } from "./endpoints/leaderboard";
import { createSocketServer } from "./sockets";

const app = express();

// apply cors
app.use(cors());

// serve static files from the public folder
app.use(express.static(path.resolve(import.meta.dir, "../public")));

// endpoints
app.get("/game", getGame);
app.get("/leaderboard", getLeaderboard);

// HTML SERVER
const PORT = 3002;

const certPath = path.resolve("certificates/localhost-cert.pem");
const keyPath = path.resolve("certificates/localhost-key.pem");

const options = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};

const html_server = https.createServer(options, app);

html_server.listen(PORT, () => {
  console.log(
    `\nWebserver is \x1b[32mlive\x1b[0m @ \x1b[1m\x1b[34mhttps\x1b[0m\x1b[0m://localhost:${PORT}\x1b[0m\n`,
  );
});

createSocketServer({ server: html_server });
