#!/bin/bash

if command -v apache2 &>/dev/null || command -v httpd &>/dev/null; then
  sed -i "/ProxyPassReverse \/pxe http:\/\/localhost:$1/d" "/etc/apache2/sites-available/froglin.proxy.conf"

  apachectl graceful
fi;

docker stop $(docker ps | grep $1 | cut -d ' ' -f 1)
