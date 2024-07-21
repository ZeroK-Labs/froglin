const maxBits = 254; // Noir Field data type is 254 bits wide
const maxBigInt = (1n << BigInt(maxBits)) - 1n; // 2^254 - 1

export function stringToBigInt(str: string): bigint {
  let hash = 0n;

  for (let i = 0; i < str.length; i++) {
    const char = BigInt(str.charCodeAt(i));
    hash = (hash << 5n) - hash + char;
    hash &= maxBigInt; // Ensure hash is within 254 bits
  }
  return hash;
}
