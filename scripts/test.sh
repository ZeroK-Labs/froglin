#!/bin/bash

list=(
  "./tests/register.test.ts"
  "./tests/eventData.test.ts"
  "./tests/capture.test.ts"
  "./tests/leaderboard.test.ts"
  "./tests/concurrency/register.test.ts"
  # "./tests/concurrency/capture.test.ts"
)
list="${list[@]}"

# list="./tests/concurrency/capture.test.ts"

bun test --preload "./tests/setup.ts" $list
