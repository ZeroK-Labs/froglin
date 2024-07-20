import { AccountWallet, PXE } from "@aztec/aztec.js";

import { FroglinContract } from "contracts/artifacts/Froglin";
import {
  createPXEServiceProcess,
  destroyPXEServiceProcess,
} from "../common/PXEManager";

export type AccountWithContract = {
  secret: bigint;
  pxe: PXE;
  pxe_url: string;
  contract: FroglinContract;
  wallet: AccountWallet;
};

const maxBits = 254; // Noir Field data type is 254 bits wide
const maxBigInt = (1n << BigInt(maxBits)) - 1n; // 2^254 - 1

export function stringToBigInt(str: string): bigint {
  let hash = 0n;
  for (let i = 0; i < str.length; i++) {
    const char = BigInt(str.charCodeAt(i));
    hash = (hash << 5n) - hash + char;
    hash &= maxBigInt; // Ensure hash is within 254 bits
  }
  return hash;
}

export function createPXEServer(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    console.log("Creating PXE...");

    const [port, pxe] = createPXEServiceProcess();

    // pxe.stderr!.on("data", (data) => {
    //   process.stderr.write(data);
    // });

    pxe.stdout!.on("data", (data) => {
      // process.stdout.write(data);

      if (!data.includes(`Aztec Server listening on port ${port}`)) return;

      console.log("PXE created successfully!");

      // TODO: this only allows HTTP under HTTPS for localhost, for server we need certificates
      resolve(`http://localhost:${port}`);
    });

    pxe.on("close", (code) => {
      const msg = `PXE process exited with code ${code}`;
      console.log(msg);

      reject(msg);
    });
  });
}

export function destroyPXEServer(url: string) {
  destroyPXEServiceProcess(Number(url.split(":")[2]));
}
