#!/bin/bash

# get environment info
source scripts/.env/get.sh
source scripts/.env/maybe_sudo.sh

# ubuntu
if [[ "$OS_NAME" == "linux" ]]; then
  # add the current user to the "docker" group
  if ! groups $USER | grep &>/dev/null "\bdocker\b"; then
    maybe_sudo usermod -aG docker $USER

    if [ $? -eq 0 ]; then
      echo "user "$USER" added to the "docker" group"
      echo "log out and back in to apply the group changes"
    else
      echo "adding user "$USER" to the "docker" group failed"
      exit 1
    fi
  fi

  # start docker daemon
  if ! pgrep -x "dockerd" > /dev/null; then dockerd; fi

# macOS
elif [[ "$OS_NAME" == "mac" ]]; then
  if docker info > /dev/null 2>&1; then exit 0; fi

  printf "Starting Docker"

  open -a Docker

  while ! docker info > /dev/null 2>&1; do
    for ((i=0; i<3; i++)); do
      printf "."
      sleep 0.33
    done
    printf "\033[3D\033[0J"
  done

  printf "...done"
fi
