import toast from "react-hot-toast";
import { TimeoutId } from "../../common/types";

function generatePlayerId() {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);

  const id = Array.from(array, (byte) => chars[byte % chars.length]).join("");

  localStorage.setItem("playerId", id);

  return id;
}

const PLAYER_ID = localStorage.getItem("playerId") ?? generatePlayerId();

const query = new URLSearchParams({ playerId: PLAYER_ID });
const url = `${process.env.WSS_URL}?${query}`;

let CLIENT_SOCKET: WebSocket;

let timerId: TimeoutId;
let retries = 0;
let closed = false;

const handlers = {
  open: [],
  close: [],
  error: [],
  message: [],
} as {
  open: ((ev: Event) => any)[];
  close: ((ev: CloseEvent) => any)[];
  error: ((ev: Event) => any)[];
  message: ((ev: MessageEvent<string>) => any)[];
};

export function addSocketEventHandler(
  name: keyof typeof handlers,
  handler:
    | ((ev: CloseEvent) => any)
    | ((ev: Event) => any)
    | ((ev: MessageEvent<string>) => any),
) {
  if (name === "open" || name === "error") {
    handlers[name].push(handler as (ev: Event) => any);
  } //
  else if (name === "close") {
    handlers[name].push(handler as (ev: CloseEvent) => any);
  } //
  else if (name === "message") {
    handlers[name].push(handler as (ev: MessageEvent<string>) => any);
  }
}

export function removeSocketEventHandler(
  name: keyof typeof handlers,
  handler:
    | ((ev: CloseEvent) => any)
    | ((ev: Event) => any)
    | ((ev: MessageEvent<string>) => any),
) {
  const handlerArray = handlers[name];
  const index = handlerArray.indexOf(handler as never);
  if (index !== -1) handlerArray.splice(index, 1);
}

// TODO: handle late subscription of event handlers for "message"
let server_pxe_url: MessageEvent<string> | null;
export function getPXEReadyMessage() {
  return server_pxe_url;
}

export function createSocketClient() {
  if (
    CLIENT_SOCKET &&
    (CLIENT_SOCKET.readyState === WebSocket.CONNECTING ||
      CLIENT_SOCKET.readyState === WebSocket.OPEN)
  ) {
    return;
  }

  function handleError(ev: Event) {
    console.error("WebSocket error:", ev);

    for (const handler of handlers["error"]) handler(ev);
  }

  function handleMessage(ev: MessageEvent<string>) {
    console.log(`Received ${ev.data}`);

    for (const handler of handlers["message"]) handler(ev);
  }

  // TODO: handle late subscription of event handlers for "message"
  function handleMessageWrapper(ev: MessageEvent<string>) {
    if (!ev.data.includes("pxe ")) {
      console.log(`Received ${ev.data}`);

      return;
    }

    handleMessage(ev);

    const url = ev.data.split(" ")[1];
    if (!url) return;

    server_pxe_url = ev;

    CLIENT_SOCKET.removeEventListener("message", handleMessageWrapper);
    CLIENT_SOCKET.addEventListener("message", handleMessage);
  }

  function handleOpen(ev: Event) {
    console.log("WebSocket connection established");

    CLIENT_SOCKET.addEventListener("error", handleError);
    CLIENT_SOCKET.addEventListener("message", handleMessageWrapper);

    server_pxe_url = null;
    retries = 0;
    closed = false;

    for (const handler of handlers["open"]) handler(ev);
  }

  function handleClose(ev: CloseEvent) {
    console.error("WebSocket connection closed");

    CLIENT_SOCKET.removeEventListener("error", handleError);
    CLIENT_SOCKET.removeEventListener("open", handleOpen);
    CLIENT_SOCKET.removeEventListener("close", handleClose);
    CLIENT_SOCKET.removeEventListener("message", handleMessage);
    CLIENT_SOCKET.removeEventListener("message", handleMessageWrapper);

    if (retries === 0) toast.error("Socket server offline");

    retries += 1;
    clearTimeout(timerId);
    timerId = setTimeout(createSocketClient, 5_000);

    if (retries === 4) retries = 0;

    if (closed) return;

    closed = true;
    for (const handler of handlers["close"]) handler(ev);
  }

  CLIENT_SOCKET = new WebSocket(url);

  CLIENT_SOCKET.addEventListener("open", handleOpen);
  CLIENT_SOCKET.addEventListener("close", handleClose);
}

export { CLIENT_SOCKET, PLAYER_ID };
