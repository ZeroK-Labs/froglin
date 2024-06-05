#!/bin/bash

get_version_curl() {
  curl --version | grep -oE "curl [0-9\.]+" | grep -oE "[0-9]+\.[0-9]+\.[0-9]+" 2>/dev/null
}

install_curl() {
  # linux Ubuntu
  if [[ "$OS_NAME" == "ubuntu" ]]; then
    sudo apt update
    sudo apt install curl -y
  # macOS
  elif [[ "$OS_NAME" == "mac" ]]; then
    brew install curl
  fi
}
