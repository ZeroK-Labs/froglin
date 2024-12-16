import { ServerOptions, WebSocketServer } from "ws";
import { createPXEClient, Fr } from "@aztec/aztec.js";
import { parse } from "url";
import { type ChildProcess } from "child_process";

import { BACKEND_WALLET } from "backend/utils/aztec";
import { CLIENT_SESSION_DATA } from "backend/start";
import { createPXEService, destroyPXEService } from "common/utils/PXEManager";
import { type ClientSessionData } from "backend/types";

const HOST =
  process.env.BACKEND_HOST === "localhost"
    ? `http://localhost:`
    : `https://${process.env.BACKEND_HOST}/pxe/`;

const REUSE_PXE_TIMEOUT = 3_000;

let ws_server: WebSocketServer;

// used on shutdown
let _terminating = false;
const terminating = () => _terminating;

async function makeBattle(
  socketMessage: { message: string; proposalId: number },
  socket: WebSocket,
) {
  const { proposalId } = socketMessage;
  socket.send("making battle");
  try {
    await BACKEND_WALLET.contracts.gateway.methods
      .make_battle(proposalId)
      .send()
      .wait();
    socket.send("battle made");
  } catch (error) {
    console.error("Error resolving battle:", error);
    socket.send("battle failed");
  }
}

async function makeDate(
  socketMessage: { message: string; proposalId: number },
  socket: WebSocket,
) {
  const { proposalId } = socketMessage;
  socket.send("making date");
  try {
    await BACKEND_WALLET.contracts.gateway.methods.make_date(proposalId).send().wait();
    socket.send("date made");
  } catch (error) {
    console.error("Error resolving date:", error);
    socket.send("date failed");
  }
}

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
          previous_socket.readyState === WebSocket.OPEN)
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
      port = clientData.PXE.port;
      url = `${HOST}${port}`;

      socket.send(`pxe ${url}`);
    } //
    else {
      // create PXE instance
      let pxe: ChildProcess;
      [port, pxe] = createPXEService(
        async () => {
          if (socket.readyState !== WebSocket.OPEN) {
            destroyPXEService(port);
            return;
          }

          url = `${HOST}${port}`;
          clientData.PXE = { process: pxe, port, reuseTimerId: null, url };

          // register contracts in PXE client
          const pxeClient = createPXEClient(url);
          await pxeClient.registerContract({
            instance: BACKEND_WALLET.contracts.gateway.instance,
            artifact: BACKEND_WALLET.contracts.gateway.artifact,
          });
          pxeClient.registerAccount(
            new Fr(BigInt(BACKEND_WALLET.secret)),
            BACKEND_WALLET.wallet.getCompleteAddress().partialAddress,
          );

          socket.send(`pxe ${url}`);
          broadcastMessage(`newPlayer ${url}`);
        },
        () => {
          clientData.PXE = null;
        },
      );
    }

    socket.on("message", (message) => {
      console.log(`Received message: ${message}`);

      if (message.toString().includes("which pxe")) socket.send(`pxe ${url}`);
      if (message.toString().includes("battle")) {
        makeBattle(JSON.parse(message.toString()), socket);
      }
      if (message.toString().includes("date")) {
        makeDate(JSON.parse(message.toString()), socket);
      }
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
          REUSE_PXE_TIMEOUT,
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
