import { createPXEService, destroyPXEService } from "../../common/PXEManager";

export function createPXE(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    console.log("Creating PXE...");

    const [port, pxe] = createPXEService();

    // pxe.stderr!.on("data", (data) => {
    //   process.stderr.write(data);
    // });

    pxe.stdout!.on("data", (data) => {
      // process.stdout.write(data);

      if (!data.includes(`Aztec Server listening on port ${port}`)) return;

      console.log("PXE created successfully!");

      resolve(`http://localhost:${port}`);
    });

    pxe.on("close", (code) => {
      const msg = `PXE process exited with code ${code}`;
      console.log(msg);

      reject(msg);
    });
  });
}

export function destroyPXE(url: string) {
  destroyPXEService(Number(url.split(":")[2]));
}
