import { ChildProcess } from "child_process";
import { WebSocketServer, ServerOptions } from "ws";

import { createPXEService, destroyPXEService } from "../common/PXEManager";
import { parse } from "url";

let ws_server: WebSocketServer;

const PXEies: { [key: string]: ChildProcess } = {};

const HOST =
  process.env.BACKEND_HOST === "localhost"
    ? `http://localhost:`
    : `https://${process.env.BACKEND_HOST}/pxe/`;

export function createSocketServer(options?: ServerOptions) {
  ws_server = new WebSocketServer(options);

  ws_server.on("connection", (socket: WebSocket, request) => {
    const query = parse(request.url!, true).query;
    const sessionId = query.sessionId as string;
    if (!sessionId) throw "Socket connection error: missing request sessionId param";

    let url = "";
    const [port, pxe] = createPXEService();

    PXEies[sessionId] = pxe;

    socket.on("message", (message) => {
      console.log(`Received message: ${message}`);

      const msg = message.toString();

      if (url !== "" && msg.includes("which pxe")) socket.send(`pxe ${url}`);
    });

    socket.on("close", () => {
      console.log("Client disconnected");

      destroyPXEService(port);
    });

    // pxe.stderr!.on("data", (data) => {
    //   process.stderr.write(data);
    // });

    pxe.stdout!.on("data", (data) => {
      // process.stdout.write(data);

      if (!data.includes(`Aztec Server listening on port ${port}`)) return;

      url = `${HOST}${port}`;
      socket.send(`pxe ${url}`);
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
