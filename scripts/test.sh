#!/bin/bash

list=(
  "./tests/events.test.ts"
  # "./tests/swap.test.ts"
  # "./tests/battle.test.ts"
  # "./tests/date.test.ts"
  # "./tests/register.test.ts"
  # "./tests/eventData.test.ts"
  # "./tests/capture.test.ts"
  # "./tests/leaderboard.test.ts"
  # "./tests/concurrency/register.test.ts"
  # "./tests/concurrency/capture.test.ts"
)
list="${list[@]}"

# list="./tests/concurrency/capture.test.ts"

bun test --preload "./tests/setup.ts" $list
