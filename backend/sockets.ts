import { WebSocketServer, ServerOptions } from "ws";

let ws_server: WebSocketServer;

export function createSocketServer(options?: ServerOptions) {
  ws_server = new WebSocketServer(options);

  ws_server.on("connection", (socket) => {
    console.log("Client connected");

    socket.on("message", (message) => {
      console.log(`Received message: ${message}`);
    });

    socket.on("close", () => {
      console.log("Client disconnected");
    });
  });
}

export function sendMessage(text: string) {
  if (!ws_server) return;

  for (const client of ws_server.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(text);
  }
}
