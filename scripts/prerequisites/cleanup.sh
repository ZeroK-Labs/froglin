#!/bin/bash

# ensure the script is sourced
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  (source $(realpath "$0"))
  exit $?
fi

# get environment info
source scripts/.env/get.sh
source scripts/.env/maybe_sudo.sh

# clear screen
echo -e "\033[H\033[2J\033[3J"

if [[ "$OS_NAME" == "linux" ]]; then
  nvm uninstall $(cat .nvmrc)

  # remove using apt-get
  maybe_sudo apt-get remove -y \
  npm yarn nodejs \
  docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc
  maybe_sudo apt autoremove -y
  maybe_sudo apt autoclean -y

  # remove docker keyring
  maybe_sudo rm -rf $DOCKER_KEYRING_PATH

elif [[ "$OS_NAME" == "mac" ]]; then
  brew uninstall --force node;
  brew uninstall --cask docker;
  brew cleanup;
fi

# remove files and folders
maybe_sudo rm -rf ~/.aztec
maybe_sudo rm -rf ~/.bun

# cleanup node
maybe_sudo rm -rf           \
/usr/local/bin/npm          \
/usr/local/lib/dtrace/node.d\
~/.node                     \
~/.npm

# cleanup nvm
maybe_sudo rm -rf ~/.nvm

# unset all functions matching the pattern nvm_*
for func in $(declare -F | grep nvm_ | awk "{print $3}"); do
  unset -f "$func"
done
unset -f "__nvm"
unset -f "nvm"

# cleanup docker
maybe_sudo rm -rf                           \
~/.docker                                   \
/Applications/Docker                        \
/usr/local/bin/docker                       \
/usr/local/bin/docker-machine               \
/usr/local/bin/docker-compose               \
/usr/local/bin/docker-credential-osxkeychain\
$HOME/Library/Containers/com.docker.docker  # here we delete stored images

# # create a backup of the original .bashrc file
# cp $ENV_VARS_FILE $ENV_VARS_FILE.bak

# define the patterns to match
patterns=(
  'export NVM_DIR="\$HOME\/\.nvm"'
  '\[ -s "\$NVM_DIR\/nvm\.sh" \] && \\. "\$NVM_DIR\/nvm\.sh"  # This loads nvm'
  '\[ -s "\$NVM_DIR\/bash_completion" \] && \\. "\$NVM_DIR\/bash_completion"  # This loads nvm bash_completion'
  '# bun'
  'export BUN_INSTALL="\$HOME\/\.bun"'
  'export PATH=$BUN_INSTALL\/bin:\$PATH'
  '# aztec'
  export PATH="~\/.aztec\/bin":\$PATH
)

# iterate over the patterns array and delete matching lines from .bashrc
for pattern in "${patterns[@]}"; do
  sed -i "/$pattern/d" $ENV_VARS_FILE
  if [ $? -ne 0 ]; then return $?; fi
done

# remove trailing newlines
sed -i ':a; /^\n*$/{$d; N; ba;}' $ENV_VARS_FILE

# reload bash context
source $ENV_VARS_FILE
