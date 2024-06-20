#!/bin/bash

# remove spaces from 1st argument
arg=$(
  var="$1"
  var="${var#"${var%%[![:space:]]*}"}" # leading
  var="${var%"${var##*[![:space:]]}"}" # trailing
  printf "$var"
)

# check if arg is in the expected values
if [[ "$arg" == "" ]] || [[ "$arg" == "dev" ]] || [[ "$arg" == "development" ]]; then
  arg=dev
elif [[ "$arg" == "prod" ]] || [[ "$arg" == "production" ]]; then
  arg=prod
else
  arg=0
fi

if [[ "$arg" == "0" ]]; then
  echo Unknown argument "\"$arg\""
  exit 1
fi

# create ssl certificates
if ! scripts/webpack/create_keys.sh; then exit $?; fi

# compile contracts
if ! scripts/aztec/prep.sh; then exit $?; fi

cleanup() {
  # kill tailwind watcher
  pkill -f "tailwind"

  local xvg=$(pgrep -f "scripts/webpack/start.sh")
  IFS=$'\n' read -r -d '' -a PIDS <<< "$xvg"
  exec bash -c "kill -2 ${PIDS[0]}"

  exit 0
}

# trap ctrl+c to call cleanup function
trap 'cleanup' INT

# run tailwind watcher (in 'dev' mode) and start webpack concurrently
if [[ "$arg" == "dev" ]]; then scripts/tailwind/start.sh; fi &
webpack serve --env mode=$arg
