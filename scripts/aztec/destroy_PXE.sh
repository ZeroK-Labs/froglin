#!/bin/bash

if command -v apache2 &>/dev/null || command -v httpd &>/dev/null; then
  CONFIG_FILE_PATH="/etc/apache2/sites-available/froglin.proxy.conf"
  if [ -f "$CONFIG_FILE_PATH" ]; then
    sed -i "/ProxyPassReverse \/pxe http:\/\/localhost:$1/d" "$CONFIG_FILE_PATH"
    apachectl graceful
  fi
fi

container=$(docker ps | grep $1 | cut -d ' ' -f 1)

if [ -z "$container" ]; then exit 0; fi;

docker stop $container >/dev/null
