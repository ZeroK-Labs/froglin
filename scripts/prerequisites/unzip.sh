#!/bin/bash

get_version_unzip() {
  unzip -v | grep -oE "UnZip [0-9\.]+" | grep -oE "[0-9]+\.[0-9]+" 2>/dev/null
}

install_unzip() {
  # linux Ubuntu
  if [[ "$OS_NAME" == "linux" ]]; then
    maybe_sudo apt update
    maybe_sudo apt install -y unzip
  # macOS
  elif [[ "$OS_NAME" == "mac" ]]; then
    brew install unzip
  fi
}
