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

start_tailwind() {
  # load env
  local env_file=.env/dev
  if [[ "$arg" == "production" ]]; then env_file=.env/prod; fi
  source $env_file

  local WEBPACK_URL=${WEBPACK_PROTOCOL:-https}://${WEBPACK_HOST:-localhost}:${WEBPACK_PORT:-8080}

  # wait for webpack to ready up
  while true; do
    # stop if webpack quit
    local count=$(pgrep -f "webpack" | wc -l)
    if (( count < 4 )); then return 0; fi

    # ping the URL for a known status, and break when good
    local status=$(curl -sSf "$WEBPACK_URL" > /dev/null 2>&1; echo $?)
    if [[ $status -eq 60 ]] || [[ $status -eq 200 ]]; then break; fi
    sleep 1
  done

  # start tailwind watcher
  tailwindcss -i src/styles/tailwind.css -o src/styles/global.css -w
  echo -e "\ntailwind watcher enabled\n"
}

# run tailwind watcher concurrently
start_tailwind &

echo -e "\n\033[32m$arg\033[0m mode\n"
webpack serve --env $arg

# kill tailwind watcher
pkill -f "tailwind"

# kill webpack instances
while true; do
  count=$(pgrep -f "webpack" | wc -l)
  if (( count == 0 )); then break; fi
  pkill -f "webpack" > /dev/null 2>&1
done
