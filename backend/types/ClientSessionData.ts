import { ChildProcess } from "child_process";

import ServerGameEvent from "./ServerGameEvent";

type ClientSessionData = {
  GameEvent: ServerGameEvent | null;
  PXE: ChildProcess | null;
  Socket: WebSocket | null;
};

export default ClientSessionData;
