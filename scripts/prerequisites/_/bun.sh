#!/bin/bash

get_version_bun() {
  bun --version 2>/dev/null
}

install_bun() {
  curl -fsSL https://bun.sh/install | bash

  if ! grep -q "# bun" $ENV_VARS_FILE; then
    echo "" >> $ENV_VARS_FILE
    echo "# bun" >> $ENV_VARS_FILE
    echo "export BUN_INSTALL="$HOME/.bun"" >> $ENV_VARS_FILE
    echo "export PATH=$BUN_INSTALL/bin:\$PATH" >> $ENV_VARS_FILE
  fi

  # reload bash context
  source $ENV_VARS_FILE
}
