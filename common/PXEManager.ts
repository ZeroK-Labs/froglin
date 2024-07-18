import { ChildProcess, spawn, exec } from "child_process";

import { getLocalIP } from "./IPUtils";

export const LOCAL_IP = `http://${getLocalIP()}:`;
export const SANDBOX_URL = LOCAL_IP + "8080";

const PXE_PORT_LOWER_BOUND = 8081;
const allocatedPorts: number[] = [];

export function createPXEServiceProcess(): [number, ChildProcess] {
  // generate a port
  let port: number;
  do {
    port =
      Math.floor(Math.random() * (65535 - PXE_PORT_LOWER_BOUND)) + PXE_PORT_LOWER_BOUND;
    //
  } while (allocatedPorts.indexOf(port) !== -1);

  allocatedPorts.push(port);

  return [
    port,
    // spawn PXE process in same terminal session
    spawn(`script -q -c "aztec start -p ${port} --pxe nodeUrl=${SANDBOX_URL}"`, {
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
    }),
  ];
}

export function destroyPXEServiceProcess(port: number) {
  const index = allocatedPorts.indexOf(port);
  if (index === -1) throw `Failed to destroy PXE service due to port ${port} missing from registry`;
  allocatedPorts.splice(index, 1);

  exec(`pkill -f ${port}`);
}
