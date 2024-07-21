import CompressionPlugin from "compression-webpack-plugin";
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import TerserPlugin from "terser-webpack-plugin";
import fs from "fs";
import path from "path";
import webpack from "webpack";
// import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";

import loadenv from "./common/loadenv.js";

export default async () => {
  // extract mode from command-line args
  let index = 0;
  const serving = process.argv[2] === "serve";

  if (process.argv[2] === "--env") index = 3;
  else if (serving) index = 4;
  else throw "Unable to identify 'mode' parameter from command line arguments";

  // prepare environment
  const mode = process.argv.slice(index)[0].split("=")[1];
  await loadenv(mode);

  const development = mode === "dev";
  const production = !development;

  //
  // https://webpack.js.org/configuration
  //
  return {
    mode: process.env.NODE_ENV,
    target: "browserslist",
    devtool: development ? "source-map" : false,
    //
    // https://webpack.js.org/configuration/entry-context
    //
    entry: {
      main: path.resolve("src/index.tsx"),
    },
    //
    // https://webpack.js.org/configuration/output
    //
    output: {
      pathinfo: false,
      path: path.resolve(`build/${mode}`),
      filename: "[name].bundle.js",
      publicPath: "/",
    },
    //
    // https://webpack.js.org/configuration/resolve
    //
    resolve: {
      extensions: [".js", ".ts", ".tsx"],
      modules: [path.resolve("src"), path.resolve("node_modules")],
      fallback: {
        crypto: false,
        fs: false,
        path: false,
        stream: false,
        tty: false,
        util: path.resolve("util"),
      },
    },
    //
    // https://webpack.js.org/configuration/plugins
    //
    plugins: [
      // new BundleAnalyzerPlugin(),
      new webpack.ProvidePlugin({ Buffer: ["buffer", "Buffer"] }),
      new HtmlWebpackPlugin({
        template: "./src/index.html",
      }),
      new webpack.DefinePlugin({
        "process.env": {
          NODE_ENV: JSON.stringify(process.env.NODE_ENV),
          SANDBOX_PORT: JSON.stringify(process.env.SANDBOX_PORT),
          SANDBOX_URL: JSON.stringify(process.env.SANDBOX_URL),
          BACKEND_URL: JSON.stringify(process.env.BACKEND_URL),
          WSS_URL: JSON.stringify(process.env.WSS_URL),
          REACT_APP_MAPBOX_ACCESS_TOKEN: JSON.stringify(
            process.env.MAPBOX_ACCESS_TOKEN,
          ),
        },
      }),
      new MiniCssExtractPlugin(),
      production &&
        new CompressionPlugin({
          filename: "[path][base].gz[query]",
          algorithm: "gzip",
          test: /\.[cjmt]sx?$|\.css$|\.html?$/,
          threshold: 0,
          minRatio: 0.8,
        }),
    ],
    //
    // https://webpack.js.org/configuration/module
    //
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: "ts-loader",
              options: {
                transpileOnly: true,
                configFile: "tsconfig.json",
              },
            },
          ],
        },
        {
          test: /\.css$/i,
          use: [MiniCssExtractPlugin.loader, "css-loader"],
        },
        {
          //
          // https://webpack.js.org/guides/asset-modules/
          //
          test: /\.(png|jpe?g|gif|svg|webp)$/i,
          use: [
            {
              loader: "file-loader",
            },
            {
              loader: "image-webpack-loader",
              options: {
                bypassOnDebug: true,
              },
            },
          ],
        },
      ],
    },
    //
    // https://webpack.js.org/configuration/performance
    //
    performance: {
      maxAssetSize: 5_000_000,
      maxEntrypointSize: 5_000_000,
    },
    //
    // https://webpack.js.org/configuration/optimization
    //
    optimization: {
      nodeEnv: process.env.NODE_ENV,
      providedExports: true,
      sideEffects: true,
      usedExports: true,
      removeEmptyChunks: true,
      removeAvailableModules: true,
      //
      // https://webpack.js.org/plugins/split-chunks-plugin/
      //
      splitChunks: {
        chunks: "all",
      },
      ...(production && {
        minimize: true,
        minimizer: [
          //
          // https://webpack.js.org/plugins/terser-webpack-plugin/#swc
          //
          new TerserPlugin({
            test: /\.[cjmt]sx?(\?.*)?$/i,
            parallel: true,
            minify: TerserPlugin.swcMinify,
            terserOptions: {
              compress: {
                ecma: 2020,
                module: true,
                arguments: true,
                // drop_console: true,
                keep_fargs: false,
                toplevel: true,
                properties: true,
              },
              mangle: {
                keep_classnames: false,
                keep_fnames: false,
                toplevel: true,
              },
              format: {
                ecma: 2020,
                comments: false,
              },
            },
          }),
          //
          // https://webpack.js.org/plugins/css-minimizer-webpack-plugin/
          //
          new CssMinimizerPlugin({
            parallel: true,
            minimizerOptions: {
              preset: [
                "default",
                {
                  discardComments: { removeAll: true },
                },
              ],
            },
          }),
        ],
      }),
    },
    //
    // https://webpack.js.org/configuration/dev-server
    //
    devServer: serving && {
      port: process.env.WEBPACK_PORT,
      allowedHosts: "all",
      historyApiFallback: true,
      hot: development,
      liveReload: production,
      client: {
        logging: development ? "verbose" : "none",
        reconnect: true,
      },
      server: {
        type: "https",
        options: {
          key: fs.readFileSync(path.resolve(process.env.SSL_KEY)),
          cert: fs.readFileSync(path.resolve(process.env.SSL_CERT)),
        },
      },
    },
  };
};
