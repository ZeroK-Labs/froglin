import { ChildProcess, spawn, exec } from "child_process";

import { getLocalIP } from "../common/IPUtils";

const PXE_PORT_LOWER_BOUND = Number(process.env.SANDBOX_PORT) + 1;
const PXE_PORT_UPPER_BOUND = 65535;
const allocatedPorts: number[] = [];

// TODO: cannot access sandbox using localhost, need IP (should be PXE_HOST)
const SANDBOX_URL = `http://${getLocalIP()}:${process.env.SANDBOX_PORT}`;

export function createPXEServiceProcess(): [number, ChildProcess] {
  // generate a port
  let port: number;
  do {
    port =
      Math.floor(Math.random() * (PXE_PORT_UPPER_BOUND - PXE_PORT_LOWER_BOUND)) +
      PXE_PORT_LOWER_BOUND;
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
  if (index === -1) {
    throw `Failed to destroy PXE service: port ${port} missing from registry`;
  }

  allocatedPorts.splice(index, 1);

  exec(`pkill -f ${port}`);
}
