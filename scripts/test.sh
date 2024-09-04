#!/bin/bash

list="./tests/register.test.ts ./tests/eventData.test.ts ./tests/stash.test.ts ./tests/leaderboard.test.ts"
# list="./tests/leaderboard.test.ts"

bun test --preload "./tests/setup.ts" $list
