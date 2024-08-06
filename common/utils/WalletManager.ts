import { AccountManager } from "@aztec/aztec.js/account";
// TODO: why TX dropped by P2P node when using Schnorr directly?
// import { SchnorrAccountContract } from "@aztec/accounts/schnorr";

import { SingleKeyAccountContract } from "@aztec/accounts/single_key";
import {
  AccountWallet,
  Fr,
  PXE,
  deriveMasterIncomingViewingSecretKey,
} from "@aztec/aztec.js";

export async function createWallet(secret: string, pxe: PXE): Promise<AccountWallet> {
  const bigNumber = BigInt(secret);
  const reducedSecret = bigNumber % Fr.MODULUS;
  const secretKey = new Fr(reducedSecret);
  const signingPrivateKey = deriveMasterIncomingViewingSecretKey(secretKey);
  const contract = new SingleKeyAccountContract(signingPrivateKey);
  const account = new AccountManager(pxe, secretKey, contract, Fr.ZERO);

  const wallet = await account.waitSetup();
  console.log("wallet ready", wallet.getAddress().toString());
  return wallet;
}
