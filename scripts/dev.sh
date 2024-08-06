#!/bin/bash

run_in_new_terminal() {
  local command=$1

  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # WSL
    if grep -q Microsoft /proc/version || [ -n "$WSL_INTEROP" ]; then
      local script="
        cd \$PWD;
        sleep 1;
        ${command};
        sleep 1;
        echo;
        echo Press any key to close this window;
        read -n 1;
      "
      powershell.exe "Start-Process wsl.exe -ArgumentList '-e bash -ci \"${script}\"'"

    # regular Linux
    else
      gnome-terminal -- bash -c "cd \"\$PWD\"; ${command}"
    fi

  # macOS
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    osascript -e "tell application \"Terminal\" to do script \"cd '$PWD'; ${command}\""

  else
    echo "Unsupported platform: $OSTYPE"
    return 1
  fi
}

commands=(
  "scripts/aztec/start.sh"
  "scripts/webpack/start.sh"
  "scripts/backend/start.sh"
)

for command in "${commands[@]}"; do
  run_in_new_terminal "$command"
done
