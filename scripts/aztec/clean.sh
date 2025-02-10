#!/bin/bash

# find all 1st level sub-directories within the base directory and split them into an array
IFS=$'\n' read -rd '' -a contracts <<< "$(find "contracts/aztec" -mindepth 1 -maxdepth 1 -type d)"

printf "\nCleaning contracts..."

for contract in "${contracts[@]}"; do
  rm -rf                           \
    "$contracts/artifact"          \
    "$contracts/target"            \
    "$contracts/codegenCache.json" || { printf "\nFailed to remove artifacts from '$contract'"; exit 1; }
done

printf "done\n"
