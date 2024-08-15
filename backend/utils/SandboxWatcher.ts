import type { PXE } from "@aztec/aztec.js";
import { createPXEClient } from "@aztec/aztec.js";

const handlers = {
  found: [],
  lost: [],
} as {
  found: (() => void)[];
  lost: (() => void)[];
};

const TIMEOUT = 5_000;

let timerId: Timer | null;
let sandboxClient: PXE | null;

export function addSandboxWatcherEventHandler(
  name: keyof typeof handlers,
  handler: () => void,
) {
  handlers[name].push(handler);
}

export function removeSandboxWatcherEventHandler(
  name: keyof typeof handlers,
  handler: () => void,
) {
  const handlerArray = handlers[name];
  const index = handlerArray.indexOf(handler);
  if (index !== -1) handlerArray.splice(index, 1);
}

export function startSandboxWatcher() {
  if (sandboxClient) {
    console.error(`Already watching Sandbox ${process.env.SANDBOX_URL!}`);

    return;
  }

  // count lines of errors in output
  let errorLines: string[];
  let clearErrors: () => void;
  let resetErrorLines: () => void;

  if (process.stderr) {
    clearErrors = () => {
      let count = 0;
      for (let i = 0; i !== errorLines.length; ++i) {
        const lineLength = errorLines[i].length;

        if (lineLength <= process.stdout.columns) count += 1;
        else {
          const factor = lineLength / process.stdout.columns;
          const floor = Math.floor(factor);

          if (floor !== factor) count += 1;
          count += floor;
        }
      }

      if (count) process.stdout.write(`\x1b[${count}A\x1b[0J`);
    };

    resetErrorLines = () => {
      errorLines = [];
    };

    const ansiRegex =
      /[\u001b\u009b][[()#;?]*((?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-PR-TZcf-ntqry=><~])?/g;

    const originalWrite = process.stderr.write.bind(process.stderr);

    process.stdout.write("\x1b[s");

    // override process.stderr.write
    process.stderr.write = function (
      chunk: any,
      encoding?: BufferEncoding | ((err?: Error | undefined) => void),
      callback?: (err?: Error | undefined) => void,
    ): boolean {
      // count lines when chunk is a string
      if (typeof chunk === "string") {
        const lines = chunk.split("\n");
        for (let i = 0; i !== lines.length; ++i) {
          const cleanLine = lines[i].replace(ansiRegex, "").trimEnd();
          if (cleanLine) errorLines.push(cleanLine);
        }
      }

      // when encoding is a function, it's actually the callback
      if (typeof encoding === "function") {
        callback = encoding;
        encoding = undefined;
      }

      // call the original write method
      return originalWrite.call(process.stderr, chunk, encoding, callback);
    };
  }

  let connected = false;
  let checking = false;
  async function checkConnection() {
    if (checking) return;

    checking = true;

    try {
      if (process.stderr) {
        if (!connected) {
          process.stdout.write("\x1b[u\x1b[0J");
          resetErrorLines();
        }
      }

      await sandboxClient!.getPXEInfo(); // does 4 retries before throwing an error

      if (!connected) {
        if (process.stderr) clearErrors();

        for (const handler of handlers["found"]) handler();
      }

      connected = true;

      if (process.stderr) resetErrorLines();
      //
    } catch (err) {
      if (process.stderr) {
        clearErrors();
        resetErrorLines();
        process.stdout.write("\x1b[s");
      }

      const error = err as any;
      console.error(`${error.code}: ${error.message} \x1b[0m${error.path}`);

      if (connected) {
        for (const handler of handlers["lost"]) handler();

        if (process.stderr) process.stdout.write("\x1b[s");
      }

      connected = false;
    }

    timerId = setTimeout(checkConnection, TIMEOUT);

    checking = false;
  }

  sandboxClient = createPXEClient(process.env.SANDBOX_URL!);
  checkConnection();
}

export function stopSandboxWatcher() {
  sandboxClient = null;

  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }
}
