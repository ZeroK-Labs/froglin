type Keyboard = {
  w: boolean;
  s: boolean;
  a: boolean;
  d: boolean;
  z: boolean;
};

export type KeyboardSymbol = keyof Keyboard;

export default Keyboard;
