#!/bin/bash

# ensure the script is sourced
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  (source $(realpath "$0"))
  exit $?
fi

# get environment info
scripts/.env/get.sh

# ask for access before proceeding
sudo -v

# enable execution of all shell files under the folder 'scripts'
find scripts -type f -name "*.sh" -exec sudo chmod +x {} \;

# enable git commit hook
GIT_COMMIT_HOOK_FILE=.git/hooks/pre-commit
if [ ! -f "$GIT_COMMIT_HOOK_FILE" ]; then
  cp scripts/git/pre-commit.sh $GIT_COMMIT_HOOK_FILE
  sudo chmod +x $GIT_COMMIT_HOOK_FILE
fi

# clear screen
echo -e "\033[H\033[2J\033[3J"

# install prerequisites
PREREQUISITES=""
for pkg in curl nvm node bun docker aztec-sandbox; do
  # load the installation script file
  source scripts/prerequisites/_/$pkg.sh

  # check if package is already available
  PACKAGE_VERSION=$(get_version_$pkg 2>/dev/null)
  if [ $? -eq 0 ]; then
    PREREQUISITES="$PREREQUISITES\n\033[32m$pkg\033[0m@$PACKAGE_VERSION"
    # print installed prerequisites
    echo -e "\033[32m$pkg\033[0m@$PACKAGE_VERSION"
    continue
  fi

  # install package
  printf "\nInstalling \033[32m$pkg\033[0m...\n\n"

  if ! install_$pkg; then return $?; fi

  # verify
  PACKAGE_VERSION=$(get_version_$pkg 2>/dev/null)
  if [ $? -ne 0 ]; then
    echo "$pkg installation failed"
    return 1
  fi

  # do post installation
  if declare -f post_install_$pkg > /dev/null;
  then
    if ! post_install_$pkg; then return $?; fi
  fi

  PREREQUISITES="$PREREQUISITES\n\033[32m$pkg\033[0m@$PACKAGE_VERSION"

  # clear screen
  echo -e "\033[H\033[2J\033[3J"

  # print installed prerequisites
  echo -e "$PREREQUISITES"
done

# install packages in a new terminal
exec bash -c 'echo "" && bun i'
