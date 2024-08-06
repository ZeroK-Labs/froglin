import { ChildProcess } from "child_process";

import GameEventServer from "common/types/GameEventServer";

type ClientSessionData = {
  GameEvent: GameEventServer | null;
  PXE: {
    process: ChildProcess;
    port: number;
    reuseTimerId: Timer | null;
  } | null;
  Socket: WebSocket | null;
};

export default ClientSessionData;
