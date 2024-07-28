const CHAR_BITS = 8n;

export function stringToBigInt(str: string): bigint {
  let bigInt = 0n;

  for (let i = 0; i !== str.length; ++i) {
    bigInt <<= CHAR_BITS;
    bigInt += BigInt(str.charCodeAt(i));
  }

  return bigInt;
}

export function bigIntToString(bigInt: bigint): string {
  let str = "";
  let temp = bigInt;

  while (temp !== 0n) {
    const charCode = Number(temp & 0xffn);
    str = String.fromCharCode(charCode) + str;
    temp >>= CHAR_BITS;
  }

  return str;
}
