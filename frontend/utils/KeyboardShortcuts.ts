const shortcuts: ((ev: KeyboardEvent) => void)[] = [];

export function removeKeyboardShortcut(handler: (ev: KeyboardEvent) => void) {
  document.removeEventListener("keypress", handler);

  for (let i = 0; i !== shortcuts.length; ++i) {
    if (shortcuts[i] == handler) {
      shortcuts.splice(i, 1);
      break;
    }
  }
}

export function addKeyboardShortcut(handler: (ev: KeyboardEvent) => void) {
  shortcuts.push(handler);
  document.addEventListener("keypress", handler);
}

export function disableShortcuts() {
  for (const handler of shortcuts) {
    document.removeEventListener("keypress", handler);
  }
}

export function enableShortcuts() {
  for (const handler of shortcuts) {
    document.addEventListener("keypress", handler);
  }
}
