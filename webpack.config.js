import CompressionPlugin from "compression-webpack-plugin";
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import TerserPlugin from "terser-webpack-plugin";

import fs from "fs";
import path from "path";
import webpack from "webpack";
// import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";

import loadenv from "./scripts/loadenv.js";

// @ts-expect-error: arguments can be any object
export default (_, argv) => {
  const mode = argv.env.mode || "dev";

  loadenv(mode);

  console.log(`\n\x1b[32m${process.env.NODE_ENV}\x1b[0m mode`);

  // https://webpack.js.org/configuration
  const development = mode === "dev";

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
      extensions: [".js", ".tsx", ".ts"],
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
          PXE_URL: JSON.stringify(process.env.PXE_URL),
          MapboxAccessToken: JSON.stringify(process.env.MAPBOX_ACCESS_TOKEN),
        },
      }),
      new CompressionPlugin({
        filename: "[path][base].gz[query]",
        algorithm: "gzip",
        test: /\.js$|\.css$|\.html$/,
        threshold: 0,
        minRatio: 1,
      }),
      new MiniCssExtractPlugin(),
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
          use: [
            {
              loader: "postcss-loader",
              options: {
                postcssOptions: {
                  config: "postcss.config.js",
                },
              },
            },
          ],
        },
        {
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
    // https://webpack.js.org/configuration/experiments
    //
    experiments: {
      // https://github.com/webpack/webpack/issues/14893
      css: true,
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
      // runtimeChunk: "single",
      removeEmptyChunks: true,
      removeAvailableModules: true,
      ...(!development && {
        minimize: true,
        minimizer: [
          //
          // https://webpack.js.org/plugins/terser-webpack-plugin/#swc
          //
          new TerserPlugin({
            test: /\.[jt]sx?(\?.*)?$/i,
            parallel: true,
            minify: TerserPlugin.swcMinify,
            terserOptions: {
              compress: {
                ecma: 2020,
                module: true,
                arguments: true,
                drop_console: true,
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
    devServer: {
      port: process.env.WEBPACK_PORT,
      allowedHosts: "all",
      historyApiFallback: true,
      hot: development,
      liveReload: !development,
      client: {
        logging: development ? "verbose" : "none",
        reconnect: true,
      },
      server: {
        type: "https",
        options: {
          key: fs.readFileSync(path.resolve("certificates/localhost-key.pem")),
          cert: fs.readFileSync(path.resolve("certificates/localhost-cert.pem")),
        },
      },
    },
  };
};
