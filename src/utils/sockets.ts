import toast from "react-hot-toast";

function generateSessionId() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const sessionId = generateSessionId();
export const CLIENT_SOCKET = new WebSocket(
  `${process.env.WSS_URL}?sessionId=${sessionId}`,
);

CLIENT_SOCKET.addEventListener("open", () => {
  console.log("WebSocket connection established");
});

CLIENT_SOCKET.addEventListener("message", (event) => {
  console.log("Received " + event.data);

  if (event.data === "newEpoch") {
    toast("New epoch", { duration: 3_000, icon: "⌛" });
  }
});

CLIENT_SOCKET.addEventListener("close", () => {
  console.log("WebSocket connection closed");
});

CLIENT_SOCKET.addEventListener("error", (error) => {
  console.error("WebSocket error:", error);
});
