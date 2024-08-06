![cover_image](public/images/cover.png)

# Introduction

Welcome to `froglin`, a mysterious universe hiding treasures and friends within!

Froglins are strange creatures which can be found all around us.
They exist solely in cryptography terms, and you can befriend them through the use of Zero-Knowledge Proofs.

This repo is the Froglin game source code.

<br>

# Contents

- [Setup](#setup)
- [Available Tasks](#available-tasks)
- [Project Organization](#project-organization)
- [Contributing](#contributing)

<br>
<br>

# Setup

This project is based on a **Linux** development environment.<br>
The setup instructions are equivalent for **macOS**.<br>
If you're using **Windows**, you'll need to [install WSL](https://learn.microsoft.com/en-us/windows/wsl/install) first.<br>

In support of the development process, the following prerequisites are used:

- [`nvm`](https://github.com/nvm-sh/nvm/blob/master/README.md)
- [`node.js` ](https://nodejs.org/en/learn/getting-started/introduction-to-nodejs)
- [`bun`](https://bun.sh/docs)
- [`docker` ](https://docs.docker.com/get-started/overview/)
- [`aztec-sandbox`](https://aztec.network/sandbox/)

<br>

### Clone repository

```sh
git clone https://github.com/ZeroK-Labs/froglin
```

<br>

### Install all dependencies (prerequistites and packages)

```sh
sudo chmod +x scripts/prerequisites/setup.sh

scripts/prerequisites/setup.sh
```

<br>

After the script completes successfully run

```sh
bun dev
```

to start `webpack`, a `tailwindcss` watcher for changes to CSS style files, and the `aztec-sandbox`.

<br>

## Available Tasks

<br>

### Install dependencies (packages only)

```sh
bun i
```

<br>

### Report outdated packages

```sh
bun packages:report
```

<br>

### Update all packages to their latest (fixed) versions

```sh
bun packages:update
```

<br>

### Build contracts typescript and JSON ABIs

```sh
bun aztec:build
```

<br>

### In-memory `typescript` project transpilation (for error checking)

```sh
typescript:compile
```

<br>

### Start `aztec-sandbox` only

```sh
bun aztec:start
```

<br>

### Start `webpack` server

```sh
bun webpack:start
```

<br>

### Start everything concurrently

```sh
bun dev
```

<br>

### Run tests

```sh
bun test
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

- #### [`push_staging.sh`](https://github.com/ZeroK-Labs/froglin/blob/main/scripts/git/push_staging.sh) - replaces the remote `staging` branch with the contents and history of the branch currently checked out
- #### [`update.sh`](https://github.com/ZeroK-Labs/froglin/blob/main/packages/update.sh) - updates all packages in `package.json` to their latest versions

<br>

- ### [`src`](https://github.com/ZeroK-Labs/froglin/blob/main/src)
  - #### [`contracts`](https://github.com/ZeroK-Labs/froglin/blob/main/frontend/contracts) - Aztec L2 Noir contracts
  - #### [`components`](https://github.com/ZeroK-Labs/froglin/blob/main/frontend/components) - React component files
  - #### [`pages`](https://github.com/ZeroK-Labs/froglin/blob/main/frontend/pages) - React pages
  - #### [`styles`](https://github.com/ZeroK-Labs/froglin/blob/main/frontend/styles) - Tailwind CSS files

<br>

- ### [`tests`](https://github.com/ZeroK-Labs/froglin/blob/main/tests) - Bun tests
  - #### [`prep`](https://github.com/ZeroK-Labs/froglin/blob/main/tests/prep.test.ts) - env loader for all tests

<br>
<br>

# Contributing

Get in touch with the owners via [Noir Discord](https://discord.gg/JtqzkdeQ6G) to be added as a collaborator.

Use the hashtag `froglin`.
