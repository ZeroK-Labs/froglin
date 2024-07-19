import { ChildProcess } from "child_process";
import { WebSocketServer, ServerOptions } from "ws";

import {
  createPXEServiceProcess,
  destroyPXEServiceProcess,
} from "../common/PXEManager";

let ws_server: WebSocketServer;

const PXEies: { [key: string]: { pxe: ChildProcess } } = {};

export function createSocketServer(options?: ServerOptions) {
  ws_server = new WebSocketServer(options);

  ws_server.on("connection", (socket: WebSocket, request) => {
    const sessionId = request.headers["sec-websocket-key"];
    if (!sessionId) throw "Socket connection error: missing request sec-websocket-key";

    const [port, pxe] = createPXEServiceProcess();

    PXEies[sessionId] = { pxe };

    socket.on("message", (message) => {
      console.log(`Received message: ${message}`);
    });

    socket.on("close", () => {
      console.log("Client disconnected");

      destroyPXEServiceProcess(port);
    });

    pxe.stdout!.on("data", (data) => {
      // process.stdout.write(data);

      if (!data.includes(`Aztec Server listening on port ${port}`)) return;

      // TODO: this only allows HTTP under HTTPS for localhost, for server we need certificates
      const url = `http://${process.env.SANDBOX_HOST}:${port}`;

      console.log("Client PXE ready", url);
      socket.send(`ready ${url}`);
    });

    pxe.stderr!.on("data", (data) => {
      process.stderr.write(data);
    });

    pxe.on("close", (code) => {
      console.log(`PXE process exited with code ${code}`);

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

  for (const sessionId in PXEies) {
    const { pxe } = PXEies[sessionId];
    pxe.kill();
    delete PXEies[sessionId];
  }

  ws_server.close();
}
