#!/bin/bash

# get environment info
source scripts/.env/get.sh
source scripts/.env/maybe_sudo.sh

# enable execution of all shell files under the folder 'scripts'
find scripts -type f -name "*.sh" -exec chmod +x {} \;

# create a default configuration file and add content
CONFIG_FILE="./env.config.js"
if [ ! -f "${CONFIG_FILE}" ]; then
  cat <<EOL > "${CONFIG_FILE}"
const configuration = {
  WEBPACK_PORT: 3001,

  SSL_KEY: "certificates/localhost-key.pem",
  SSL_CERT: "certificates/localhost-cert.pem",

  SANDBOX_HOST: "localhost",
  SANDBOX_PORT: 8080,

  BACKEND_HOST: "localhost",
  BACKEND_PORT: 3002,
  BACKEND_WALLET_SECRET: "1234",
};

export default configuration;
EOL
fi;

# enable git commit hook
GIT_COMMIT_HOOK_FILE=.git/hooks/pre-commit
if [ ! -f "$GIT_COMMIT_HOOK_FILE" ]; then
  cp scripts/git/pre-commit.sh $GIT_COMMIT_HOOK_FILE
  chmod +x $GIT_COMMIT_HOOK_FILE
fi

# clear screen
printf "\033[H\033[2J\033[3J"

# install prerequisites
PREREQUISITES=""
for pkg in curl unzip nvm node bun docker aztec-sandbox; do
  # load the installation script file
  source scripts/prerequisites/$pkg.sh

  # check package version (available and matches required, else returns an error)
  PACKAGE_VERSION=$(get_version_$pkg 2>/dev/null)
  if [ $? -ne 0 ]; then
    # install missing packages
    printf "\nInstalling \033[32m$pkg\033[0m...\n\n"
    install_$pkg || { exit $?; }

    # verify
    PACKAGE_VERSION=$(get_version_$pkg 2>/dev/null)
    if [ $? -ne 0 ]; then
      echo "$pkg installation failed"
      exit 1
    fi

    # post installation
    if declare -f post_install_$pkg > /dev/null;
    then
      post_install_$pkg || { exit $?; }
    fi

    # reload bash context
    source $ENV_VARS_FILE
  fi

  # store installed package and version (for pretty-printing)
  PREREQUISITES="$PREREQUISITES\n\033[32m$pkg\033[0m@$PACKAGE_VERSION"

  # clear screen
  printf "\033[H\033[2J\033[3J"

  # print installed prerequisites
  printf "$PREREQUISITES\n"
done

# install package dependecies
echo ""
bun i

warn_when_source_required;
