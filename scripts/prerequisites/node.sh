#!/bin/bash

get_version_node() {
  # check if .nvmrc file exists
  if [ ! -f .nvmrc ]; then
    echo ".nvmrc file is missing from repository"
    return 1
  fi

  # read the Node.js version from .nvmrc
  local PROJECT_VERSION=$(cat .nvmrc)

  # try and execute node, if present, to get the version
  local INSTALLED_VERSION=$(node --version 2>/dev/null)
  if [ $? -ne 0 ]; then INSTALLED_VERSION=""; fi

  if [[ "$PROJECT_VERSION" == "$INSTALLED_VERSION" ]]; then
    echo $PROJECT_VERSION
  else
    return 1
  fi
}

install_node() {
  source $(dirname "$0")/prerequisites/nvm.sh
  load_nvm || { return $?; }

  nvm install >/dev/null || { return $?; }

  local PROJECT_NODE_VERSION=$(cat .nvmrc)
  nvm alias default $PROJECT_NODE_VERSION
  nvm use
}
