#!/bin/bash

clear

contracts=(
  "contracts/aztec/gateway"
  # "contracts/aztec/registration"
)

if [[ "${contracts}" == "" ]]; then
  printf "\nNothing to compile\n"
  exit 0
fi

printf "\nCompiling contracts...\n"

for contract in "${contracts[@]}"; do
  printf "\nCleaning '${contract}' artefacts..."

  artefacts="
    ${contracts}/artifact
    ${contracts}/target
    ${contracts}/codegenCache.json
  "
  rm -rf ${artefacts} || {
    printf "\nFailed to remove artifacts from '$contract'\n"
    exit 1
  }

  cd "${contract}" || {
    printf "\nFailed to find contract '$contract'\n"
    exit 1
  }

  printf "\nCompiling '$contract'...\n"
  aztec-nargo compile --silence-warnings || { exit 1; }

  printf "Generating '$contract' ABI...\n"
  aztec codegen target -o artifact || { exit 1; }

  cd - > /dev/null || {
    printf "\nFailed to change back to previous directory\n"
    exit 1
  }
done

printf "\nCompiling contracts done\n"
