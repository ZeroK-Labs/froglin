import toast from "react-hot-toast";

import { generateID } from "./id";

if (!localStorage.getItem("sessionId")) localStorage.setItem("sessionId", generateID());

const SESSION_ID = localStorage.getItem("sessionId")!;

const query = new URLSearchParams({ sessionId: SESSION_ID });
const url = `${process.env.WSS_URL}?${query}`;

// attach socket to the window object to persist across module reloads
const _window = window as any;
let CLIENT_SOCKET: WebSocket = _window.__CLIENT_SOCKET;
_window.__socket_reload =
  CLIENT_SOCKET &&
  (CLIENT_SOCKET.readyState === WebSocket.CONNECTING ||
    CLIENT_SOCKET.readyState === WebSocket.OPEN);

let retries = 0;

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

function handleClose(ev: CloseEvent) {
  console.error("WebSocket connection closed");

  if (!_window.__socket_closed) {
    CLIENT_SOCKET.removeEventListener("error", handleError);
    CLIENT_SOCKET.removeEventListener("open", handleOpen);
    CLIENT_SOCKET.removeEventListener("close", handleClose);
    CLIENT_SOCKET.removeEventListener("message", handleMessage);
    CLIENT_SOCKET.removeEventListener("message", handleMessageWrapper);

    _window.__socket_closed = true;
    for (const handler of handlers["close"]) handler(ev);
  }

  // during HMR, context is stale, need to abort
  if (_window.__socket_reload) {
    _window.__socket_reload = false;
    return;
  }

  if (retries === 0) toast.error("Socket server offline");

  retries += 1;
  clearTimeout(_window.__socket_reconnect_timerId);
  _window.__socket_reconnect_timerId = setTimeout(createSocketClient, 5_000);

  if (retries === 4) retries = 0;
}

function handleOpen(ev: Event) {
  console.log("WebSocket connection established");

  CLIENT_SOCKET.addEventListener("error", handleError);
  CLIENT_SOCKET.addEventListener("message", handleMessageWrapper);

  _window.__socket_reconnect_timerId = null;
  server_pxe_url = null;
  retries = 0;
  _window.__socket_closed = false;

  for (const handler of handlers["open"]) handler(ev);
}

export function createSocketClient() {
  // during HMR, remove previous socket connection
  if (
    CLIENT_SOCKET &&
    (CLIENT_SOCKET.readyState === WebSocket.CONNECTING ||
      CLIENT_SOCKET.readyState === WebSocket.OPEN)
  ) {
    CLIENT_SOCKET.close();
  }

  // during HMR, clear previous module's attempt to reconnect
  // if it initialized without a connection to socket server
  if (_window.__socket_reconnect_timerId && !_window.__socket_closed) {
    clearTimeout(_window.__socket_reconnect_timerId);
  }

  CLIENT_SOCKET = new WebSocket(url);
  CLIENT_SOCKET.addEventListener("open", handleOpen);
  CLIENT_SOCKET.addEventListener("close", handleClose);

  _window.__CLIENT_SOCKET = CLIENT_SOCKET;
}

export { CLIENT_SOCKET, SESSION_ID };
