#!/bin/bash

get_version_docker() {
  docker --version | grep -oE 'Docker version [0-9\.]+' | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' 2>/dev/null
}

install_docker() {
  # linux Ubuntu
  if [[ "$OS_NAME" == "ubuntu" ]]; then
    # uninstall conflicting packages
    sudo apt-get remove docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc -y
    if [ $? -ne 0 ]; then return $?; fi

    # add Docker's official GPG key
    DOCKER_KEYRING_PATH="/etc/apt/keyrings/docker.asc"
    if [ -f "$DOCKER_KEYRING_PATH" ]; then
      sudo rm "$DOCKER_KEYRING_PATH"
    fi
    sudo apt-get update
    sudo apt-get install ca-certificates -y
    sudo install -m 0755 -d /etc/apt/keyrings
    sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o $DOCKER_KEYRING_PATH
    if [ $? -ne 0 ]; then
      echo "docker keyring download failed"
      return 1
    fi
    sudo chmod a+r /etc/apt/keyrings/docker.asc

    # add the docker repository to apt-sources
    echo "deb [arch=$(dpkg --print-architecture) signed-by=$DOCKER_KEYRING_PATH] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update

    sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y
  # macOS
  elif [[ "$OS_NAME" == "mac" ]]; then
    brew install homebrew/cask/docker
  fi
}
