import os from "os";
import { ChildProcess, spawn, spawnSync } from "child_process";

// TODO: cannot access sandbox using localhost, need specific IP
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

// TODO: cannot access sandbox using localhost, need specific IP
const HOST = process.env.SANDBOX_URL!.replace("localhost", getLocalIP());

const allocatedPorts: number[] = [];

export function createPXEService(): [number, ChildProcess] {
  if (allocatedPorts.length === 32) throw "Max 32 PXE service instances";

  // allocate a port sequentially
  let port = Number(process.env.SANDBOX_PORT) + 1;
  while (allocatedPorts.includes(port)) port += 1;
  allocatedPorts.push(port);

  const pxe = spawn(
    `scripts/aztec/destroy_PXE.sh ${port};
     scripts/aztec/create_PXE.sh ${port} ${HOST}`,
    {
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  pxe.on("close", () => {
    const index = allocatedPorts.indexOf(port);
    if (index === -1) {
      console.error(
        `Failed to destroy PXE service: port ${port} is missing from registry`,
      );

      return;
    }
    allocatedPorts.splice(index, 1);
  });

  return [port, pxe];
}

export function destroyPXEService(port: number) {
  const destroyPXE = spawnSync(`scripts/aztec/destroy_PXE.sh ${port}`, {
    shell: true,
    stdio: "ignore", // "inherit",
  });

  if (destroyPXE.status !== 0) console.error(`Failed to destroy PXE on port ${port}`);
}
