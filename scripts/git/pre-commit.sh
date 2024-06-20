#!/bin/bash

printf "\n*** Linting staged files ***\n\n"

# get the list of staged files from git
staged_files=$(git diff --name-only --cached)

# loop the staged list and extract the lint-able files
lint_files="";
for file in $staged_files; do
  if [ -e "$file" ] &&
  printf "$file" | grep -Eq '\.(ts|js|tsx|jsx|cjs|mjs)$';
  then
    lint_files="$file $lint_files"
  fi
done

# lint the files if there are any
if [ -z "$lint_files" ]; then
  printf "*** From the staged files none are lintable, \033[33mskipping\033[0m ***\n\n"
  exit 0
fi

bun lint --config eslint.config.js $lint_files

result=$?

printf "\n*** Linting completed "
if [[ $result != 0 ]]; then printf "\033[31mwith errors\033[0m "; fi
printf " ***\n\n"

if [[ $result != 0 ]]; then exit 1; fi
