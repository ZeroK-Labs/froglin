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

# read the list of ignored packages from the .packageignore file, if it exists
ignoreFile=$(dirname "$(realpath "${BASH_SOURCE[0]}")")"/.packageignore"
ignoredPackages=()

if [[ -f "${ignoreFile}" ]]; then
  while IFS= read -r line; do
    # trim whitespace, ignore empty lines and lines starting with "#"
    cleanLine=$(echo "${line}" | xargs) # xargs trims leading/trailing spaces
    if [[ -n "${cleanLine}" && ! "${cleanLine}" =~ ^# ]]; then
      ignoredPackages+=("${cleanLine}")
    fi
  done < "${ignoreFile}"
fi

# filter out packages that are in .packageignore
filteredPackages=()
for package in "${outdatedPackages[@]}"; do
  packageName=$(echo "$package" | cut -d'@' -f1)

  skip=false

  for ignored in "${ignoredPackages[@]}"; do
    if [[ "${packageName}@" == *"${ignored}"* ]]; then
      printf "Skipping \033[32m${packageName}\033[0m\n"
      skip=true
      break
    fi
  done

  if [[ "${skip}" == false ]]; then
    filteredPackages+=("${package}")
  fi
done

# check if there are any packages left to update
if [[ ${#filteredPackages[@]} -eq 0 ]]; then
  echo "No packages to update after filtering .packageignore"
  exit 0
fi

# read package.json
packageJson=$(cat package.json) >/dev/null

# select appropriate parameter for sed
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS uses -E for extended
  sedArgs="-E"
else
  # Linux uses -r for extended regex
  sedArgs="-r"
fi

# transform dependency to replace / with \/
for dependency in "${filteredPackages[@]}"; do
  # Determine the count of "@" characters
  count=$(echo "${dependency}" | grep -o "@" | wc -l)

  # split the dependency by "@"
  IFS='@' read -r -a arr <<< "${dependency}"

  # determine the name and version
  if [[ "$count" -eq 2 ]]; then
    name="@${arr[1]}"
  else
    name="${arr[0]}"
  fi
  version="${arr[$count]}"

  # escape characters in name and version
  name=$(echo "${name}" | sed 's/\//\\\//g')
  version=$(echo "${version}" | sed 's/\./\\./g')

  # update dependencies in packageJson
  packageJson=$(echo "${packageJson}" | sed ${sedArgs} "s/\"${name}\"[[:space:]]*:[[:space:]]*\"[^\"]*\"/\"${name}\": \"${version}\"/")
done

echo "${packageJson}" > package.json

bun i
