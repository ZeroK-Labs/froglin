#!/bin/bash

# run the npm outdated command and capture the output in memory
outdatedOutput=$(npm outdated --parseable --depth=0 | cut -d: -f4)

# check if the outdatedOutput variable is empty
if [[ -z "$outdatedOutput" ]]; then
  echo "Packages are up to date"
  exit 0
fi

# split the output by "\n"
IFS=$'\n' read -r -d '' -a outdatedPackages <<< "$outdatedOutput"

# read package.json
packageJson=$(cat package.json) > /dev/null

# transform dependency to replace / with \/
for dependency in "${outdatedPackages[@]}"; do
  # determine the count of "@" characters
  count=$(echo "$dependency" | grep -o "@" | wc -l)

  # split the dependency by "@"
  IFS='@' read -r -a arr <<< "$dependency"

  # determine the name and version
  if [[ "$count" -eq 2 ]]; then
    name="@${arr[1]}"
  else
    name="${arr[0]}"
  fi
  version="${arr[$count]}"

  # escape characters in name and version
  name=$(echo "$name" | sed -e 's/\//\\\//g')
  version=$(echo "$version" | sed -e 's/\./\\./g')

  # update dependencies in packageJson
  packageJson=$(echo "$packageJson" | sed -E "s/\"$name\"[[:space:]]*:[[:space:]]*\"[^\"]*\"/\"$name\": \"$version\"/")
done

echo "$packageJson" > package.json
