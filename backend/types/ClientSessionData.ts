import { ChildProcess } from "child_process";

import type { InterestPoint, MapCoordinates } from "common/types";

type ClientSessionData = {
  PXE: {
    process: ChildProcess;
    port: number;
    reuseTimerId: Timer | null;
  } | null;
  Socket: WebSocket | null;
  location: MapCoordinates;
  bounds: [number, number][][];
  interestPoints: InterestPoint[];
};

export default ClientSessionData;
