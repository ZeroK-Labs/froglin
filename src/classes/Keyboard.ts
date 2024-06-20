import { Keyboard } from "types";

export function nullKeyboard(): Keyboard {
  return {
    w: false,
    s: false,
    a: false,
    d: false,
    z: false,
  };
}

export function nullifyKeyboard(keyboard: Keyboard): Keyboard {
  keyboard.w = keyboard.s = keyboard.a = keyboard.d = false;

  return keyboard;
}
