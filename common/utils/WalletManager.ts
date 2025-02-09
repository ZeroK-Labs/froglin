import type { PXE, AccountWallet } from "@aztec/aztec.js";
import { AccountManager } from "@aztec/aztec.js/account";
// TODO: why TX dropped by P2P node when using Schnorr directly?
// import { SchnorrAccountContract } from "@aztec/accounts/schnorr";
import { Fr, deriveMasterIncomingViewingSecretKey } from "@aztec/aztec.js";
import { SingleKeyAccountContract } from "@aztec/accounts/single_key";

export async function createWallet(secret: string, pxe: PXE): Promise<AccountWallet> {
  const bigNumber = BigInt(secret);
  const secretKey = new Fr(bigNumber % Fr.MODULUS);
  const signingPrivateKey = deriveMasterIncomingViewingSecretKey(secretKey);
  const accountContract = new SingleKeyAccountContract(signingPrivateKey);
  const account = await AccountManager.create(pxe, secretKey, accountContract, Fr.ZERO);

  const wallet = await account.waitSetup();
  console.log(`Wallet ready \x1b[34m${wallet.getAddress().toString()}\x1b[0m`);
  return wallet;
}
