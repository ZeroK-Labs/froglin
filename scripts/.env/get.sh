#!/bin/bash

# set platform-specific variables

# linux
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # ubuntu
  if [ -f /etc/lsb-release ]; then
    source /etc/lsb-release

    if [[ "$DISTRIB_ID" == "Ubuntu" ]]; then
      OS_NAME="ubuntu"
    else
      echo "This script only supports Ubuntu for Linux"
      exit 1
    fi
  else
    echo "This script only supports Ubuntu for Linux"
    exit 1
  fi
# macOS
elif [[ "$OSTYPE" == "darwin"* ]]; then
  OS_NAME="mac"
else
  echo "Unsupported OS "$OSTYPE""
  echo "This script only supports Linux Ubuntu and macOS"
  exit 1
fi

# set terminal-specific variables

ENV_VARS_FILE=~/."${SHELL##/bin/}"rc

export OS_NAME;
export ENV_VARS_FILE;
