#!/bin/bash

COMMAND="docker compose -f $HOME/.aztec/docker-compose.yml -p sandbox up"

open_new_terminal_and_run_sandbox() {
  local TITLE="aztec-sandbox"

  # # WSL
  # if grep -q microsoft /proc/version; then
  #     cmd.exe /c start cmd.exe "$TITLE" /k "mode con: cols=180 lines=40 & wsl $COMMAND"
  # el
  if command -v gnome-terminal &> /dev/null; then
    gnome-terminal -- bash -c "$COMMAND; exec bash"
  elif command -v xterm &> /dev/null; then
    xterm -hold -geometry 240x40 -T "$TITLE" -e "$COMMAND"
  elif command -v konsole &> /dev/null; then
    konsole --geometry 240x40 -e bash -c "$COMMAND; exec bash"
    # macOS
  elif command -v osascript &> /dev/null; then
    osascript -e "tell application \"Terminal\" to do script \"$COMMAND\""
  # windows (Cygwin, Git Bash, etc.)
  elif command -v powershell.exe &> /dev/null; then
    powershell.exe -Command "Start-Process powershell -ArgumentList '$COMMAND; Read-Host' -Title '$TITLE'"
  elif command -v cmd.exe &> /dev/null; then
    cmd.exe /c start cmd.exe "$TITLE" /k "mode con: cols=180 lines=40 & $COMMAND"
  else
    echo "No supported terminal emulator found"
    exit 1
  fi
}

# start docker, as needed
scripts/docker/start.sh

# stop sandbox
docker compose -f $HOME/.aztec/docker-compose.yml -p sandbox down > /dev/null 2>&1

if [[ "$1" == "newWindow" ]]; then
  open_new_terminal_and_run_sandbox
else
  $COMMAND
fi;

# TODO: use this after finding out how to start a specific sandbox version

# # Use grep to find the line containing "@aztec/accounts"
# line=$(grep '@aztec/aztec.js' package.json)

# # Use sed to extract the version number
# VERSION=$(echo $line | sed -n 's/.*"@aztec\/aztec\.js": "\([0-9.]*\)".*/\1/p')

# VERSION=0.42.0
