#!/bin/bash

get_version_nvm() {
  if [ -s "$NVM_DIR/nvm.sh" ]; then
    source "$NVM_DIR/nvm.sh"
  else
    return 1
  fi

  nvm --version 2>/dev/null
}

install_nvm() {
  # set environment vars
  export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"

  # reload bash context
  source $ENV_VARS_FILE

  # install
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

  # reload bash context
  source $ENV_VARS_FILE

  # load nvm
  if [ -s "$NVM_DIR/nvm.sh" ]; then
    source "$NVM_DIR/nvm.sh"
  else
    echo "nvm startup failed"
    return 1
  fi

  # load bash auto-complete
  [ -s "$NVM_DIR/bash_completion" ] && source "$NVM_DIR/bash_completion"
}
