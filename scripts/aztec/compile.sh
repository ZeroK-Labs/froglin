#!/bin/bash

# find all 1st level sub-directories within the base directory and split them into an array
# IFS=$'\n' read -rd '' -a contracts <<< "$(find "aztec/contracts" -mindepth 1 -maxdepth 1 -type d)"

# contracts=("aztec/contracts/gateway")
contracts=("aztec/contracts/gateway" "aztec/contracts/event")

printf "\nCompiling contracts...\n"

for contract in "${contracts[@]}"; do
  cd "$contract" || { echo "Failed to find contract '$contract'"; exit 1; }

  printf "\nCompiling '$contract'...\n"
  ${AZTEC_NARGO:-aztec-nargo} compile --silence-warnings || { exit 1; }

  printf "Generating '$contract' ABI...\n"
  ${AZTEC_BUILDER:-aztec-builder} codegen target -o artifact || { exit 1; }

  cd - > /dev/null || { echo "Failed to change back to previous directory"; exit 1; }
done

printf "\nCompiling contracts done\n"
