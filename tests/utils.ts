import { AccountManager } from "@aztec/aztec.js/account";
import { SingleKeyAccountContract } from "@aztec/accounts/single_key";
import {
  AccountWallet,
  Fr,
  PXE,
  deriveMasterIncomingViewingSecretKey,
} from "@aztec/aztec.js";

import { FroglinContract } from "contracts/artifacts/Froglin";

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

type SecretKey = number | bigint | boolean | Fr | Buffer;

export type AccountWithContract = {
  secret: bigint;
  contract: FroglinContract;
  wallet: AccountWallet;
};

export async function createWallet(
  pxe: PXE,
  secret: SecretKey,
): Promise<AccountWallet> {
  const secretKey = new Fr(secret);
  const encryptionPrivateKey = deriveMasterIncomingViewingSecretKey(secretKey);
  const contract = new SingleKeyAccountContract(encryptionPrivateKey);
  const manager = new AccountManager(pxe, secretKey, contract);

  const wallet = await manager.register();
  return wallet;
}
