import { AccountManager } from "@aztec/aztec.js/account";
import { SingleKeyAccountContract } from "@aztec/accounts/single_key";
import {
  AccountWallet,
  Fr,
  PXE,
  deriveMasterIncomingViewingSecretKey,
} from "@aztec/aztec.js";

type SecretKey = number | bigint | boolean | Fr | Buffer;

export async function createWallet(secret: SecretKey, pxe: PXE): Promise<AccountWallet> {
  const secretKey = new Fr(secret);
  const encryptionPrivateKey = deriveMasterIncomingViewingSecretKey(secretKey);
  const contract = new SingleKeyAccountContract(encryptionPrivateKey);
  const manager = new AccountManager(pxe, secretKey, contract);

  const wallet = await manager.register();
  return wallet;
}
