import dotenv from "dotenv";
import fs from "fs";

export default (production = false) => {
  // determine the environment file to use
  const envFile = production ? ".env/prod" : ".env/dev";

  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
  } else {
    console.error(`Environment file ${envFile} not found`);

    return 1;
  }

  process.env.PXE_PROTOCOL = process.env.PXE_PROTOCOL || "http";
  process.env.PXE_HOST = process.env.PXE_HOST || "localhost";
  process.env.PXE_PORT = process.env.PXE_PORT || "8080";
  process.env.WEBPACK_PROTOCOL = process.env.WEBPACK_PROTOCOL || "https";
  process.env.WEBPACK_HOST = process.env.WEBPACK_HOST || "localhost";
  process.env.WEBPACK_PORT = process.env.WEBPACK_PORT || "3001";

  process.env.PXE_URL =
    process.env.PXE_PROTOCOL +
    "://" +
    process.env.PXE_HOST +
    ":" +
    process.env.PXE_PORT;

  process.env.WEBPACK_URL =
    process.env.WEBPACK_PROTOCOL +
    "://" +
    process.env.WEBPACK_HOST +
    ":" +
    process.env.WEBPACK_PORT;
};
