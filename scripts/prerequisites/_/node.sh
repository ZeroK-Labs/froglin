#!/bin/bash

get_version_node() {
  # check if .nvmrc file exists
  if [ ! -f .nvmrc ]; then
    echo ".nvmrc file is missing from repository"
    return 1
  fi

  # read the Node.js version from .nvmrc
  local PROJECT_NODE_VERSION=$(cat .nvmrc)

  # try and execute node, if present, to get the version
  local INSTALLED_NODE_VERSION=$(node --version 2>/dev/null)
  if [ $? -ne 0 ]; then INSTALLED_NODE_VERSION=""; fi

  if [[ "$PROJECT_NODE_VERSION" == "$INSTALLED_NODE_VERSION" ]]; then
    echo $PROJECT_NODE_VERSION
  else
    return 1
  fi
}

install_node() {
  nvm install > /dev/null
  if [ $? -ne 0 ]; then return $?; fi
  local PROJECT_NODE_VERSION=$(cat .nvmrc)
  nvm alias default $PROJECT_NODE_VERSION
  nvm use
}
