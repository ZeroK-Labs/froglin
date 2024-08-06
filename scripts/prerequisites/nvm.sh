#!/bin/bash

load_nvm() {
  # load nvm
  if [ -s "$NVM_DIR/nvm.sh" ]; then
    source "$NVM_DIR/nvm.sh"
  else
    echo "nvm startup failed"
    return 1
  fi

  # load bash auto-complete
  if [ -s "$NVM_DIR/bash_completion" ]; then
    source "$NVM_DIR/bash_completion"
  else
    echo "nvm startup failed"
    return 1
  fi
}

get_version_nvm() {
  nvm --version 2>/dev/null || { return $?; }
}

install_nvm() {
  # set environment vars
  export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"

  # install
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

  load_nvm || { return $?; }
}
