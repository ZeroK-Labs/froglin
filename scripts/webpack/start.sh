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
  arg=development
elif [[ "$arg" == "prod" ]] || [[ "$arg" == "production" ]]; then
  arg=production
else
  arg=0
fi

if [[ "$arg" == "0" ]]; then
  echo Unknown argument "\"$arg\""
  return 1
fi

# create ssl certificates
if ! scripts/webpack/create_keys.sh; then return $?; fi

# compile contracts
if ! scripts/aztec/prep.sh; then return $?; fi

echo -e "\n\033[32m$arg\033[0m mode\n"

# run tailwind watcher concurrently
concurrently -k "scripts/tailwind/start.sh" "webpack serve --env $arg"

# kill tailwind watcher
pkill -f "tailwind"

# kill webpack instances
while true; do
  count=$(pgrep -f "webpack" | wc -l)
  if (( count == 0 )); then break; fi
  pkill -f "webpack" > /dev/null 2>&1
done
