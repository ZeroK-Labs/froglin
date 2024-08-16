#!/bin/bash

if command -v apache2 &>/dev/null || command -v httpd &>/dev/null; then
  CONFIG_FILE_PATH="/etc/apache2/sites-available/froglin.proxy.conf"
  if [ -f "$CONFIG_FILE_PATH" ]; then
    echo "ProxyPassReverse /pxe http://localhost:$1" >> "/etc/apache2/sites-available/froglin.proxy.conf"
    apachectl graceful
  fi
fi;

docker run                    \
  --rm                        \
  --workdir "$PWD"            \
  -v $HOME:$HOME              \
  -v cache:/cache             \
  -p $1:$1                    \
  -e AZTEC_PORT=$1            \
  -e AZTEC_NODE_URL="$2"      \
  aztecprotocol/aztec:latest  \
  start --pxe
