import os from "os";
import { ChildProcess, spawn } from "child_process";

// TODO: cannot access sandbox using localhost, need IP (should be SANDBOX_HOST)
export function getLocalIP() {
  const interfaces = os.networkInterfaces();
  if (!interfaces) throw "This device is missing a network adapter";

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      // Skip over internal (i.e., 127.0.0.1) and non-IPv4 addresses
      if ("IPv4" !== iface.family || iface.internal !== false) continue;

      return iface.address;
    }
  }

  throw "Failed to find IP address of this device";
}

const PXE_PORT_LOWER_BOUND = Number(process.env.SANDBOX_PORT) + 1;
const PXE_PORT_UPPER_BOUND = 65535;
const allocatedPorts: number[] = [];

// TODO: cannot access sandbox using localhost, need IP (should be SANDBOX_HOST)
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
    spawn(`scripts/aztec/create_PXE.sh ${port} ${SANDBOX_URL}`, {
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
    }),
  ];
}

export function destroyPXEServiceProcess(port: number) {
  const index = allocatedPorts.indexOf(port);
  if (index === -1) {
    console.log(`Failed to destroy PXE service: port ${port} is missing from registry`);
  }

  allocatedPorts.splice(index, 1);

  spawn(`scripts/aztec/destroy_PXE.sh ${port}`, {
    shell: true,
    stdio: "ignore", //"inherit",
  });
}
