import HtmlWebpackPlugin from "html-webpack-plugin";
import fs from "fs";
import path from "path";
import webpack from "webpack";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

import loadenv from "./scripts/loadenv.js";

export default (_, argv) => {
  loadenv(argv.env.production);

  return {
    mode: process.env.NODE_ENV,
    target: "web",
    devtool: argv.env.production ? false : "source-map",
    entry: {
      main: "./src/app.tsx",
    },
    output: {
      pathinfo: false,
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: "ts-loader",
              options: {
                transpileOnly: true,
              },
            },
          ],
        },
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader", "postcss-loader"],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "src/index.html",
      }),
      new webpack.DefinePlugin({
        "process.env": {
          NODE_ENV: JSON.stringify(process.env.NODE_ENV),
          PXE_URL: JSON.stringify(process.env.PXE_URL),
          MAPBOX_ACCESS_TOKEN: JSON.stringify(process.env.MAPBOX_ACCESS_TOKEN),
        },
      }),
      new webpack.ProvidePlugin({ Buffer: ["buffer", "Buffer"] }),
    ],
    resolve: {
      extensions: [".js", ".tsx", ".ts"],
      modules: [path.resolve("src"), "node_modules"],
      fallback: {
        crypto: false,
        fs: false,
        path: false,
        stream: false,
        tty: false,
        util: require.resolve("util"),
      },
    },
    experiments: {
      asyncWebAssembly: true,
      lazyCompilation: true,
      // css: true,
    },
    optimization: {
      nodeEnv: process.env.NODE_ENV,
      runtimeChunk: true,
      removeEmptyChunks: true,
      providedExports: true,
      removeAvailableModules: true,
      sideEffects: true,
      usedExports: "global",
    },
    devServer: {
      hot: true,
      // open: true,
      // compress: true,
      port: process.env.WEBPACK_PORT,
      // If you know the specific host, add it here
      // allowedHosts: ["bore.pub", "192.168.*.*", "localhost"],
      allowedHosts: "all",

      // server: {
      //   type: "https",
      //   options: {
      //     key: fs.readFileSync(path.resolve("certificates/localhost-key.pem")),
      //     cert: fs.readFileSync(
      //       path.resolve("certificates/localhost-cert.pem"),
      //     ),
      //   },
      // },
    },
  };
};
