#!/bin/bash

if [ ! -f "src/contracts/artifacts/Froglin.ts" ]; then
  scripts/aztec/prep.sh
fi

bun test
