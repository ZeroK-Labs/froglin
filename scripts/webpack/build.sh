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

scripts/.ssl/create_localhost_certificates.sh || { exit 1; }

bun webpack --env mode=$arg
