import type { PXE, AccountWallet } from "@aztec/aztec.js";
import { AccountManager } from "@aztec/aztec.js/account";
// TODO: why TX dropped by P2P node when using Schnorr directly?
// import { SchnorrAccountContract } from "@aztec/accounts/schnorr";
import { Fr, deriveMasterIncomingViewingSecretKey } from "@aztec/aztec.js";
import { SingleKeyAccountContract } from "@aztec/accounts/single_key";

export async function createWallet(secret: string, pxe: PXE): Promise<AccountWallet> {
  const bigNumber = BigInt(secret);
  const reducedSecret = bigNumber % Fr.MODULUS;
  const secretKey = new Fr(reducedSecret);
  const signingPrivateKey = deriveMasterIncomingViewingSecretKey(secretKey);
  const contract = new SingleKeyAccountContract(signingPrivateKey);
  const account = new AccountManager(pxe, secretKey, contract, Fr.ZERO);

  const wallet = await account.waitSetup();
  console.log("Wallet ready", wallet.getAddress().toString());
  return wallet;
}
