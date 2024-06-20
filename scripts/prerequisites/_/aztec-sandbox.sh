#!/bin/bash

start_docker() {
  if [[ "$OS_NAME" == "ubuntu" ]]; then
    # add the current user to the "docker" group
    if ! groups $USER | grep &>/dev/null "\bdocker\b"; then
      sudo usermod -aG docker $USER

      if [ $? -eq 0 ]; then
        echo "user "$USER" added to the "docker" group"
        echo "log out and back in to apply the group changes"
      else
        echo "adding user "$USER" to the "docker" group failed"
        return 1
      fi
    fi

    # start docker daemon
    if ! pgrep -x "dockerd" > /dev/null; then sudo dockerd; fi

  elif [[ "$OS_NAME" == "mac" ]]; then
    if docker info > /dev/null 2>&1; then return 0; fi

    printf "Starting Docker"

    open -a Docker

    while ! docker info > /dev/null 2>&1; do
      for ((i=0; i<3; i++)); do
        printf "."
        sleep 0.33
      done
      printfe "\033[3D\033[0J"
    done

    printf "...done"
  fi
}

get_version_aztec-sandbox() {
  start_docker

  # stop sandbox
  docker compose -f $HOME/.aztec/docker-compose.yml -p sandbox down > /dev/null 2>&1

  # read the Node.js version from .nvmrc
  local PROJECT_VERSION=$(aztec --version | grep -oE "[0-9]+\.[0-9]+\.[0-9]+" 2>/dev/null)

  # grep the line containing "@aztec/accounts"
  local line=$(grep '@aztec/aztec.js' package.json)

  # extract the toml file version
  local TOML_VERSION=$(grep -oE 'aztec-packages-v[0-9]+\.[0-9]+\.[0-9]+' src/contracts/Nargo.toml | head -n 1 | sed -E 's/aztec-packages-v([0-9]+\.[0-9]+\.[0-9]+)/\1/')

  # sync toml version with project version when different
  if [[ "$PROJECT_VERSION" != "$TOML_VERSION" ]]; then
    sed -i "s/aztec-packages-v$TOML_VERSION/aztec-packages-v$PROJECT_VERSION/" src/contracts/Nargo.toml
  fi

  # extract the version number
  local INSTALLED_VERSION=$(echo $line | sed -n 's/.*"@aztec\/aztec\.js": "\([0-9.]*\)".*/\1/p')

  if [[ "$PROJECT_VERSION" == "$INSTALLED_VERSION" ]]; then
    echo $PROJECT_VERSION
  else
    return 1
  fi
}

install_aztec-sandbox() {
  if ! grep -q "# aztec" $ENV_VARS_FILE; then

    local path_root=""
    if [[ "$OS_NAME" == "ubuntu" ]]; then path_root="/home";
    elif [[ "$OS_NAME" == "mac" ]]; then path_root="/Users";
    fi

    echo "" >> $ENV_VARS_FILE
    echo "# aztec" >> $ENV_VARS_FILE
    echo export PATH="$path_root/$USER/.aztec/bin":\$PATH >> $ENV_VARS_FILE

    # reload bash context
    source $ENV_VARS_FILE
  fi

  # Use grep to find the line containing "@aztec/accounts"
  local line=$(grep '@aztec/aztec.js' package.json)

  # Use sed to extract the version number
  local VERSION=$(echo $line | sed -n 's/.*"@aztec\/aztec\.js": "\([0-9.]*\)".*/\1/p')

  yes | VERSION=$VERSION bash <(curl -fsSL install.aztec.network)
}
