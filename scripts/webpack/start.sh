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

cleanup() {
  pkill -f 'tailwind|webpack'
}

# trap ctrl+c to call cleanup function
trap 'cleanup' INT

# create ssl certificates
if ! scripts/webpack/create_keys.sh; then exit $?; fi

# kill previous webpack instances
xvg=$(pgrep -f webpack)
IFS=$'\n' read -r -d '' -a PIDS <<< "$xvg"
for ((i = 0; i <= ${#PIDS[@]}-3; ++i)); do
  echo "Killing PID: ${PIDS[i]}"
  kill -2 ${PIDS[i]}
done

# start webpack concurrently and run tailwind watcher
bun webpack serve --env mode=$arg &
scripts/tailwind/start.sh

cleanup
