#!/bin/bash

get_version_curl() {
  curl --version | grep -oE "curl [0-9\.]+" | grep -oE "[0-9]+\.[0-9]+\.[0-9]+" 2>/dev/null
}

install_curl() {
  # linux Ubuntu
  if [[ "$OS_NAME" == "linux" ]]; then
    maybe_sudo apt update
    maybe_sudo apt install -y curl
  # macOS
  elif [[ "$OS_NAME" == "mac" ]]; then
    brew install curl
  fi
}
