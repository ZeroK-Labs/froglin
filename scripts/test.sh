#!/bin/bash

# list="./tests/register.test.ts ./tests/eventInfo.test.ts"
list="./tests/eventInfo.test.ts"

bun test --preload "./tests/setup.ts" $list
