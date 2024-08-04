const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function generateID(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);

  return Array.from(array, (byte) => chars[byte % chars.length]).join("");
}
