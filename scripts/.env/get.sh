#!/bin/bash

# set platform-specific variables

# linux
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
  if [ -f /etc/os-release ]; then
    source /etc/os-release

    if [[ "$ID" == "ubuntu" ]]; then
      DOCKER_KEYRING_PATH="/etc/apt/keyrings/docker.asc"
    elif [[ "$ID" == "debian" ]]; then
      DOCKER_KEYRING_PATH="/etc/apt/keyrings/docker.gpg"
    else
      echo "This script only supports Ubuntu and Debian distributions"
      exit 1
    fi
  else
    echo "This script only supports Ubuntu and Debian distributions"
    exit 1
  fi

  OS_DISTRIBUTION=$ID
  OS_NAME="linux"

# macOS
elif [[ "$OSTYPE" == "darwin"* ]]; then
  OS_NAME="mac"

# other OS
else
  echo "Unsupported OS "$OSTYPE""
  echo "This script only supports Linux Ubuntu, Debian, and macOS"

  exit 1
fi

# set terminal-specific variables

ENV_VARS_FILE=~/."${SHELL##/bin/}"rc

export OS_NAME;
export ENV_VARS_FILE;
