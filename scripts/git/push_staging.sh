#!/bin/bash

previous_branch=$(git rev-parse --abbrev-ref HEAD)
git branch -d staging || git branch -D staging
git checkout -b staging
git push -f origin staging
git checkout \"$previous_branch\"
