#!/bin/bash

list="./tests/register.test.ts ./tests/stash.test.ts ./tests/eventInfo.test.ts"
# list="./tests/stash.test.ts"

bun test --preload "./tests/setup.ts" $list
