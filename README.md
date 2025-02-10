![cover_image](public/images/cover.png)

# Introduction

Welcome to `froglin`, a mysterious universe hiding treasures and friends within!

Froglins are strange creatures which can be found all around us.
They exist solely in cryptography terms, and you can befriend them through the use of Zero-Knowledge Proofs.

This repo is the Froglin game source code.

<br>

# Contents

- [Setup](#setup)
- [Tasks](#tasks)
- [Project Organization](#project-organization)
- [Contributing](#contributing)

<br>
<br>

# Setup

This project is based on a **Linux** development environment.<br>
The setup instructions are equivalent for **macOS**.<br>
If you're using **Windows**, you'll need to [install WSL](https://learn.microsoft.com/en-us/windows/wsl/install) first.<br>

In support of the development process, the following prerequisites are used:

- [`bun`](https://bun.sh/docs)
- [`docker` ](https://docs.docker.com/get-started/overview/)
- [`aztec-sandbox`](https://aztec.network/sandbox/)

<br>

### Clone repository

```sh
git clone https://github.com/ZeroK-Labs/froglin
```

<br>

### Install dependencies: prerequistites and packages


On first run, enable the setup script:

```sh
sudo chmod +x ./scripts/setup.sh
```
<br>

NOTE: *Since Aztec is updated frequently, it is recommended to run this script instead of the usual* `bun i` *to update prequisites and packages, as it ensures the latest version of the sandbox is avalable locally.*

<br>

Run the setup:

```sh
./scripts/setup.sh
```

After the script completes successfully, to use the tools you'll need to refresh the environment, or start a new console session. Follow the instructions shown on screen. This reloading will only be needed the very first time the script is run.<br>
<br>

An `env.config.js` will be created on disk. This is the environment variables file, and it is filled with default values.<br>
<br>

The last step in the setup is to [add a `MAPBOX_ACCESS_TOKEN`](https://docs.mapbox.com/help/getting-started/access-tokens/) to `env.config.js` in order to access `mapbox` API for development.

<br>

### Remove dependencies, uninstalling everything

This will remove packages from `node_modules` **and** uninstall the prerequisites.

```sh
./scripts/cleanup.sh
```

<br>
<br>

# Tasks

### Build contracts and JSON ABIs

```sh
./scripts/aztec/compile.sh
```
or
```sh
bun aztec:build
```

<br>

### Start `aztec-sandbox`

```sh
./scripts/aztec/start.sh
```
or
```sh
bun aztec:start
```

<br>

### Start backend server

```sh
./scripts/backend/start.sh
```
or
```sh
bun backend:start
```

<br>

### Start frontend server

```sh
./scripts/webpack/start.sh
```
or
```sh
bun webpack:start
```

<br>

### Running tests

Backend server can be shutdown, as it isn't required for testing.<br>

These tests can take a long time (>5 mins) to complete.<br>
The list can be filtered by editing the `test.sh` file.

```sh
./scripts/test.sh
```
or
```sh
bun run test
```

<br>

<br>
<br>

# Project Organization

### [`configuration`](https://github.com/ZeroK-Labs/froglin/blob/main/TBD)

- #### [`eslint`](https://github.com/ZeroK-Labs/froglin/blob/main/.eslintrc.ts)
- #### [`prettier`](https://github.com/ZeroK-Labs/froglin/blob/main/.prettierrc.json)
- #### [`tailwind`](https://github.com/ZeroK-Labs/froglin/blob/main/tailwind.config.ts)
- #### [`typescript`](https://github.com/ZeroK-Labs/froglin/blob/main/tsconfig.json)
- #### [`webpack`](https://github.com/ZeroK-Labs/froglin/blob/main/webpack.config.js)

<br>

### [`scripts`](https://github.com/ZeroK-Labs/froglin/blob/main/scripts)
  - #### [`.env`](https://github.com/ZeroK-Labs/froglin/blob/main/scripts/.env) - Environment management
  - #### [`.ssh`](https://github.com/ZeroK-Labs/froglin/blob/main/scripts/.ssh) - SSH-related scripting
  - #### [`.ssl`](https://github.com/ZeroK-Labs/froglin/blob/main/scripts/.ssl) - SSL Certificate management
  - #### [`aztec`](https://github.com/ZeroK-Labs/froglin/blob/main/scripts/aztec) - Aztec Sandbox management and contract compilation
  - #### [`backend`](https://github.com/ZeroK-Labs/froglin/blob/main/scripts/backend) - Backend management and deployment
  - #### [`docker`](https://github.com/ZeroK-Labs/froglin/blob/main/scripts/docker) - Docker management (required for Aztec Sandbox)
  - #### [`git`](https://github.com/ZeroK-Labs/froglin/blob/main/scripts/git) - GIT hooks and scripting
  - #### [`packages`](https://github.com/ZeroK-Labs/froglin/blob/main/scripts/packages) - Package update management
  - #### [`prerequisites`](https://github.com/ZeroK-Labs/froglin/blob/main/scripts/prerequisites) - Individual installation scripts for all prerequisites
  - #### [`tailwind`](https://github.com/ZeroK-Labs/froglin/blob/main/scripts/tailwind) - Tailwind management (required for frontend)
  - #### [`webpack`](https://github.com/ZeroK-Labs/froglin/blob/main/scripts/webpack) - Frontend management and deployment

<br>

### [`aztec`](https://github.com/ZeroK-Labs/froglin/blob/main/aztec)
  - #### [`contracts`](https://github.com/ZeroK-Labs/froglin/blob/main/contracts/aztec) - Aztec L2 Noir contracts

<br>


### [`backend`](https://github.com/ZeroK-Labs/froglin/blob/main/backend)
  - #### [`endpoints`](https://github.com/ZeroK-Labs/froglin/blob/main/frontend/endpoints) - HTTP endpoints
  - #### [`stores`](https://github.com/ZeroK-Labs/froglin/blob/main/stores) - Server runtime data
  - #### [`types`](https://github.com/ZeroK-Labs/froglin/blob/main/types) - Server-only types
  - #### [`utils`](https://github.com/ZeroK-Labs/froglin/blob/main/utils) - helpers, managers, converters, globals

<br>

### [`frontend`](https://github.com/ZeroK-Labs/froglin/blob/main/frontend)
  - #### [`adapters`](https://github.com/ZeroK-Labs/froglin/blob/main/adapters) - Package adapters
  - #### [`assets`](https://github.com/ZeroK-Labs/froglin/blob/main/adapters) - Models, 2D and 3D
  - #### [`components`](https://github.com/ZeroK-Labs/froglin/blob/main/frontend/components) - React component files
  - #### [`pages`](https://github.com/ZeroK-Labs/froglin/blob/main/frontend/pages) - React pages
  - #### [`enums`](https://github.com/ZeroK-Labs/froglin/blob/main/enums) - Client-only enums
  - #### [`types`](https://github.com/ZeroK-Labs/froglin/blob/main/types) - Client-only types
  - #### [`stores`](https://github.com/ZeroK-Labs/froglin/blob/main/stores) - Client runtime data
  - #### [`styles`](https://github.com/ZeroK-Labs/froglin/blob/main/frontend/styles) - Tailwind CSS files
  - #### [`utils`](https://github.com/ZeroK-Labs/froglin/blob/main/utils) - helpers, managers, converters, globals

<br>

### [`tests`](https://github.com/ZeroK-Labs/froglin/blob/main/tests) - Bun tests
  - #### [`setup`](https://github.com/ZeroK-Labs/froglin/blob/main/tests/setup.ts) - preparation for all tests
  - #### [`accounts`](https://github.com/ZeroK-Labs/froglin/blob/main/tests/accounts.ts) - setup of accounts and wallets common to all tests
  - #### [`register`](https://github.com/ZeroK-Labs/froglin/blob/main/tests/register.test.ts) - tests registration and updates to account details
  - #### [`eventData`](https://github.com/ZeroK-Labs/froglin/blob/main/tests/eventData.test.ts) - tests event lifecycle management
  - #### [`leaderboard`](https://github.com/ZeroK-Labs/froglin/blob/main/tests/leaderboard.test.ts) - tests leaderboard scoring management
  - #### [`capture - single`](https://github.com/ZeroK-Labs/froglin/blob/main/tests/capture/single.test.ts) - tests capturing of a single Froglin
  - #### [`capture - multi`](https://github.com/ZeroK-Labs/froglin/blob/main/tests/capture/multi.test.ts) - tests capturing multiple Froglins
  - #### [`concurrency - register`](https://github.com/ZeroK-Labs/froglin/blob/main/tests/concurrency/register.test.ts) - tests concurrent registration and updates to account details
  - #### [`concurrency - capture`](https://github.com/ZeroK-Labs/froglin/blob/main/tests/concurrency/capture.test.ts) - tests concurrent capturing of Froglins

<br>
<br>

# Contributing

Get in touch with the owners via [Noir Discord](https://discord.gg/JtqzkdeQ6G) to be added as a collaborator.

Use the hashtag `froglin`.
