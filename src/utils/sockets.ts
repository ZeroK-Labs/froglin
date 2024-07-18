export const CLIENT_SOCKET = new WebSocket("wss://localhost:3002");

CLIENT_SOCKET.addEventListener("open", () => {
  console.log("WebSocket connection established");
});

CLIENT_SOCKET.addEventListener("message", (event) => {
  console.log("Received " + event.data);

  if (event.data === "reload") window.location.reload();
});

CLIENT_SOCKET.addEventListener("close", () => {
  console.log("WebSocket connection closed");
});

CLIENT_SOCKET.addEventListener("error", (error) => {
  console.error("WebSocket error:", error);
});
