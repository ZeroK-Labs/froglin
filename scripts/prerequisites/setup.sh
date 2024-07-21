#!/bin/bash

# ensure the script is sourced
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  (source $(realpath "$0"))
  exit $?
fi

# get environment info
source scripts/.env/get.sh
source scripts/.env/maybe_sudo.sh

# enable execution of all shell files under the folder 'scripts'
find scripts -type f -name "*.sh" -exec chmod +x {} \;

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
  source scripts/prerequisites/_/$pkg.sh

  # check package version (available and matches required, else returns an error)
  PACKAGE_VERSION=$(get_version_$pkg 2>/dev/null)
  if [ $? -ne 0 ]; then
    # install missing packages
    printf "\nInstalling \033[32m$pkg\033[0m...\n\n"
    if ! install_$pkg; then exit $?; fi

    # verify
    PACKAGE_VERSION=$(get_version_$pkg 2>/dev/null)
    if [ $? -ne 0 ]; then
      echo "$pkg installation failed"
      exit 1
    fi

    # post installation
    if declare -f post_install_$pkg > /dev/null;
    then
      if ! post_install_$pkg; then exit $?; fi
    fi
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
