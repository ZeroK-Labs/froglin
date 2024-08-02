#!/bin/bash

get_version_docker() {
  docker --version 2>/dev/null | grep -oE 'Docker version [0-9\.]+' | grep -oE '[0-9]+\.[0-9]+\.[0-9]+'
}

install_docker() {
  # linux
  if [[ "$OS_NAME" == "linux" ]]; then
    # uninstall conflicting packages
    maybe_sudo apt-get remove docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc -y
    if [ $? -ne 0 ]; then return $?; fi
    maybe_sudo apt-get autoclean -y
    maybe_sudo apt-get autoremove -y

    # ensure prerequisites are installed
    maybe_sudo apt-get update
    maybe_sudo apt-get install -y \
    apt-transport-https ca-certificates software-properties-common gnupg

    maybe_sudo mkdir -p /etc/apt/keyrings
    if [ -f "$DOCKER_KEYRING_PATH" ]; then maybe_sudo rm "$DOCKER_KEYRING_PATH"; fi

    if [[ "$OS_DISTRIBUTION" == "ubuntu" ]]; then
      # add Docker's official GPG key
      maybe_sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o $DOCKER_KEYRING_PATH
      if [ $? -ne 0 ]; then
        echo "docker keyring download failed"
        return 1
      fi
      maybe_sudo chmod a+r "$DOCKER_KEYRING_PATH"

      # add docker repository to apt-sources
      echo "deb [arch=$(dpkg --print-architecture) signed-by=$DOCKER_KEYRING_PATH] https://download.docker.com/linux/ubuntu \
        $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
        maybe_sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    elif [[ "$OS_DISTRIBUTION" == "debian" ]]; then
      # add Docker's official GPG key
      maybe_sudo curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o $DOCKER_KEYRING_PATH
      if [ $? -ne 0 ]; then
        echo "docker keyring download failed"
        return 1
      fi

      # add docker repository to apt-sources
      echo "deb [arch=$(dpkg --print-architecture) signed-by=$DOCKER_KEYRING_PATH] https://download.docker.com/linux/debian \
      $(lsb_release -cs) stable" | \
      maybe_sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    fi

    # install docker
    maybe_sudo apt-get update
    maybe_sudo apt-get install -y \
    docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

  # macOS
  elif [[ "$OS_NAME" == "mac" ]]; then
    brew install homebrew/cask/docker
  fi
}
