#!/bin/bash

docker run                    \
  --rm                        \
  --workdir "$PWD"            \
  -v $HOME:$HOME              \
  -v cache:/cache             \
  -p $1:$1                    \
  ${DOCKER_ENV:-}             \
  ${DOCKER_HOST_BINDS:-}      \
  ${DOCKER_USER:-}            \
  aztecprotocol/aztec:latest  \
  start -p $1 --pxe nodeUrl=$2
