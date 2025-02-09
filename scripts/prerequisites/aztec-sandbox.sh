#!/bin/bash

get_version_aztec-sandbox() {
  scripts/docker/start.sh

  # stop sandbox
  docker compose -f $HOME/.aztec/docker-compose.yml -p sandbox down > /dev/null 2>&1

  # read the aztec version
  local INSTALL_VERSION=$(aztec --version 2>/dev/null | grep -oE "[0-9]+\.[0-9]+\.[0-9]+")

  # grep the line containing "@aztec/accounts"
  local line=$(grep '@aztec/aztec.js' package.json)

  # extract the version number
  local PACKAGE_VERSION=$(echo $line | sed -n 's/.*"@aztec\/aztec\.js": "\([0-9.]*\)".*/\1/p')

  # find all Nargo.toml files
  find "aztec" -name "Nargo.toml" | while read toml_file; do
    # extract the toml file version
    local TOML_VERSION=$(grep -oE 'aztec-packages-v[0-9]+\.[0-9]+\.[0-9]+' "$toml_file" | head -n 1 | sed -E 's/aztec-packages-v([0-9]+\.[0-9]+\.[0-9]+)/\1/')

    # sync toml version with package version when different
    if [[ "$PACKAGE_VERSION" != "$TOML_VERSION" ]]; then
      sed -i "s/aztec-packages-v$TOML_VERSION/aztec-packages-v$PACKAGE_VERSION/g" "$toml_file"
    fi
  done

  if [[ "$PACKAGE_VERSION" == "$INSTALL_VERSION" ]]; then
    echo $PACKAGE_VERSION
  else
    return 1
  fi

}

install_aztec-sandbox() {
  if ! grep -q "# aztec" "$ENV_VARS_FILE"; then
    echo "" >> $ENV_VARS_FILE
    echo "# aztec" >> $ENV_VARS_FILE
    echo export PATH="~/.aztec/bin":\$PATH >> $ENV_VARS_FILE

    export PATH=~/.aztec/bin:$PATH
  fi

  # Use grep to find the line containing "@aztec/accounts"
  local line=$(grep '@aztec/aztec.js' package.json)

  # Use sed to extract the version number
  local VERSION=$(echo $line | sed -n 's/.*"@aztec\/aztec\.js": "\([0-9.]*\)".*/\1/p')

  yes | VERSION=$VERSION bash <(curl -fsSL install.aztec.network)
}
