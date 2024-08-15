import { WebSocketServer, ServerOptions } from "ws";
import { createPXEClient } from "@aztec/aztec.js";
import { parse } from "url";

import type { ClientSessionData } from "backend/types";
import { BACKEND_WALLET } from "backend/utils/aztec";
import { CLIENT_SESSION_DATA } from "backend/start";
import { createPXEService, destroyPXEService } from "common/utils/PXEManager";

const HOST =
  process.env.BACKEND_HOST === "localhost"
    ? `http://localhost:`
    : `https://${process.env.BACKEND_HOST}/pxe/`;

let ws_server: WebSocketServer;

// used on shutdown
let _terminating = false;
const terminating = () => _terminating;

export function createSocketServer(options?: ServerOptions) {
  ws_server = new WebSocketServer(options);

  ws_server.on("connection", (socket: WebSocket, request) => {
    const query = parse(request.url!, true).query;
    const sessionId = query.sessionId as string;
    if (!sessionId) {
      console.error("Socket connection error: missing request sessionId param");

      return;
    }

    if (CLIENT_SESSION_DATA[sessionId]) {
      const previous_socket = CLIENT_SESSION_DATA[sessionId].Socket;
      if (
        previous_socket &&
        (previous_socket.readyState === WebSocket.CONNECTING ||
          previous_socket.readyState == WebSocket.OPEN)
      ) {
        console.error(
          `Failed to initialize a new connection: socket ${sessionId} already open`,
        );
        socket.close();

        return;
      }
    }

    const clientData = CLIENT_SESSION_DATA[sessionId] ?? ({} as ClientSessionData);

    let url = "";
    let port: number;
    if (clientData.PXE && clientData.PXE.reuseTimerId !== null) {
      // reuse PXE instance
      clearTimeout(clientData.PXE.reuseTimerId);
      port = clientData.PXE!.port;
      url = `${HOST}${port}`;

      socket.send(`pxe ${url}`);
    } //
    else {
      let pxe;
      [port, pxe] = createPXEService();

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

        clientData.PXE = { process: pxe, port, reuseTimerId: null };

        socket.send(`pxe ${url}`);
        console.log("PXE ready", url);
      });

      pxe.on("close", (code) => {
        clientData.PXE = null;
        console.log(`PXE process exited with code ${code}`);
      });
    }

    socket.on("message", (message) => {
      console.log(`Received message: ${message}`);

      if (message.toString().includes("which pxe")) socket.send(`pxe ${url}`);
    });

    socket.on("close", () => {
      clientData.Socket = null;

      if (terminating()) destroyPXEService(port);
      else {
        // delay destruction to allow reuse of PXE process on quick reconnect
        if (!clientData.PXE) return;

        clientData.PXE.reuseTimerId = setTimeout(
          () => {
            clientData.PXE!.reuseTimerId = null;
            destroyPXEService(port);
          }, //
          3_000,
        );
      }

      console.log("Client disconnected");
    });

    clientData.Socket = socket;

    CLIENT_SESSION_DATA[sessionId] = clientData;

    console.log("Client connected", sessionId, port);
  });
}

export function destroySocketServer() {
  _terminating = true;

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
