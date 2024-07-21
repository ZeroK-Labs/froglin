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
