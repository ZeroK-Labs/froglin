import { WebSocketServer, ServerOptions } from "ws";
import { createPXEClient } from "@aztec/aztec.js";
import { parse } from "url";

import { BACKEND_WALLET } from "./aztec";
import { ClientSessionData } from "./types";
import { createPXEService, destroyPXEService } from "common/PXEManager";

export const CLIENT_SESSION_DATA: { [key: string]: ClientSessionData } = {};

const HOST =
  process.env.BACKEND_HOST === "localhost"
    ? `http://localhost:`
    : `https://${process.env.BACKEND_HOST}/pxe/`;

let ws_server: WebSocketServer;

export function createSocketServer(options?: ServerOptions) {
  ws_server = new WebSocketServer(options);

  ws_server.on("connection", (socket: WebSocket, request) => {
    const query = parse(request.url!, true).query;
    const playerId = query.playerId as string;
    if (!playerId) {
      console.error("Socket connection error: missing request playerId param");

      return;
    }

    if (CLIENT_SESSION_DATA[playerId]) {
      const previous_socket = CLIENT_SESSION_DATA[playerId].Socket;

      if (
        previous_socket &&
        (previous_socket.readyState === WebSocket.CONNECTING ||
          previous_socket.readyState == WebSocket.OPEN)
      ) {
        console.error("Failed to initialize socket connection: socket already open");

        socket.close();

        return;
      }
    }

    const clientData = CLIENT_SESSION_DATA[playerId] ?? ({} as ClientSessionData);

    let url = "";
    const [port, pxe] = createPXEService();

    socket.on("message", (message) => {
      console.log(`Received message: ${message}`);

      const msg = message.toString();

      if (msg.includes("which pxe")) {
        socket.send(`pxe ${clientData.PXE ? url : ""}`);
      }
    });

    socket.on("close", () => {
      console.log("Client disconnected");

      clientData.Socket = null;

      destroyPXEService(port);
    });

    clientData.Socket = socket;

    // pxe.stderr!.on("data", (data) => {
    //   process.stderr.write(data);
    // });

    pxe.stdout!.on("data", async (data) => {
      // process.stdout.write(data);

      if (!data.includes(`Aztec Server listening on port ${port}`)) return;

      url = `${HOST}${port}`;

      // register contracts in PXE client
      const pxeClient = createPXEClient(url);
      await pxeClient.registerContract({
        instance: BACKEND_WALLET.contracts.gateway.instance,
        artifact: BACKEND_WALLET.contracts.gateway.artifact,
      });

      clientData.PXE = pxe;

      socket.send(`pxe ${url}`);
      console.log("PXE ready", url);
    });

    pxe.on("close", (code) => {
      const msg = `PXE process exited with code ${code}`;
      console.log(msg);

      clientData.PXE = null;
    });

    CLIENT_SESSION_DATA[playerId] = clientData;

    console.log("Client connected", playerId, port);
  });
}

export function destroySocketServer() {
  if (!ws_server) return;

  for (const client of ws_server.clients) {
    if (client.readyState === WebSocket.OPEN) client.close();
  }

  ws_server.close();
}

export function broadcastMessage(text: string) {
  if (!ws_server) return;

  console.log(`broadcasting ${text}`);

  for (const client of ws_server.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(text);
  }
}
