#!/bin/bash

printf "\nCleaning... "
scripts/aztec/clean.sh
echo "done"

scripts/aztec/prep.sh
