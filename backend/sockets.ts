import { ChildProcess } from "child_process";
import { WebSocketServer, ServerOptions } from "ws";

import {
  createPXEServiceProcess,
  destroyPXEServiceProcess,
} from "../common/PXEManager";

let ws_server: WebSocketServer;

const PXEies: { [key: string]: ChildProcess } = {};

const PXE_ROOT_URL =
  process.env.SANDBOX_HOST === "localhost"
    ? `http://localhost:`
    : `https://${process.env.SANDBOX_HOST}/pxe/`;

export function createSocketServer(options?: ServerOptions) {
  ws_server = new WebSocketServer(options);

  ws_server.on("connection", (socket: WebSocket, request) => {
    const sessionId = request.headers["sec-websocket-key"];
    if (!sessionId) throw "Socket connection error: missing request sec-websocket-key";

    const [port, pxe] = createPXEServiceProcess();

    PXEies[sessionId] = pxe;

    socket.on("message", (message) => {
      console.log(`Received message: ${message}`);
    });

    socket.on("close", () => {
      console.log("Client disconnected");

      destroyPXEServiceProcess(port);
    });

    // pxe.stderr!.on("data", (data) => {
    //   process.stderr.write(data);
    // });

    pxe.stdout!.on("data", (data) => {
      // process.stdout.write(data);

      if (!data.includes(`Aztec Server listening on port ${port}`)) return;

      const url = `${PXE_ROOT_URL}${port}`;
      socket.send(`ready ${url}`);
      console.log("PXE ready", url);
    });

    pxe.on("close", (code) => {
      const msg = `PXE process exited with code ${code}`;
      console.log(msg);

      delete PXEies[sessionId];
    });

    console.log("Client connected", sessionId, port);
  });
}

export function broadcastMessage(text: string) {
  if (!ws_server) return;

  for (const client of ws_server.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(text);
  }
}

export function destroySocketServer() {
  if (!ws_server) return;

  for (const client of ws_server.clients) {
    if (client.readyState === WebSocket.OPEN) client.close();
  }

  // for (const sessionId in PXEies) {
  //   PXEies[sessionId].kill();
  // }

  ws_server.close();
}
