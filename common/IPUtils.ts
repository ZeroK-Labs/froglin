import os from "os";

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
