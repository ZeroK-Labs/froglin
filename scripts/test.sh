#!/bin/bash

if [ ! -f "contracts/artifacts/Froglin.ts" ]; then
  scripts/aztec/prep.sh
fi

bun test
