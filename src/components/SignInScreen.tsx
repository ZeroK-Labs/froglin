import { useState, useEffect } from "react";
import { AccountManager } from "@aztec/aztec.js/account";
import { SingleKeyAccountContract } from "@aztec/accounts/single_key";
import {
  AccountWallet,
  Contract,
  Fr,
  PXE,
  Wallet,
  createPXEClient,
  deriveMasterIncomingViewingSecretKey,
} from "@aztec/aztec.js";
import { usePXEClient } from "stores";
import { stringToBigInt } from "utils/math";

export default function SignInScreen({
  setUser,
}: {
  setUser: React.Dispatch<boolean>;
}) {
  const [viewSignIn, setViewSignIn] = useState(true);
  const { connected, pxeClient } = usePXEClient();

  const [touchCoordinates, setTouchCoordinates] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [lastRecordTime, setLastRecordTime] = useState(0);
  const [accountContract, setAccountContract] = useState<SingleKeyAccountContract>();
  const [account, setAccount] = useState<AccountManager>();
  const [wallet, setWallet] = useState<AccountWallet>();
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(
    () => {
      if (touchCoordinates.length < 100) return;
      if (touchCoordinates.length > 100) {
        setTouchCoordinates(touchCoordinates.slice(0, 100));
      }
      // TODO: uncomment this when we deploy the sandbox
      // if (!pxeClient) return;
      let accountRes: AccountManager;
      let walletRes: AccountWallet;
      const secretKey = stringToBigInt(touchCoordinates);
      const keyFr = new Fr(secretKey);
      const encryptionPrivateKey = deriveMasterIncomingViewingSecretKey(keyFr);

      localStorage.setItem("user", JSON.stringify(encryptionPrivateKey));
      const accountContract = new SingleKeyAccountContract(encryptionPrivateKey);
      setAccountContract(accountContract);

      accountRes = new AccountManager(pxeClient, keyFr, accountContract);

      setLoading(true);
      (async function registerAccount() {
        if (!accountRes) return;
        walletRes = await accountRes.register();

        if (walletRes) {
          setWallet(walletRes);
        }
        setLoading(false);
        setUser(true);
      })();
    }, //
    [touchCoordinates],
  );

  const handleTouch = (event: React.TouchEvent<HTMLDivElement>) => {
    const now = Date.now();

    if (now - lastRecordTime > 100) {
      // Throttle check: more than 30 ms since last record
      const touches = event.touches;
      if (touches.length > 0 && touchCoordinates.length < 100) {
        const touch = touches[0]; // Just record the first touch point
        // if one of coordinates is already in the string, don't add it again
        if (
          touchCoordinates.includes(`${touch.clientX}`) ||
          touchCoordinates.includes(`${touch.clientY}`)
        ) {
          return;
        }

        const xCoordsString = (touch.clientX | 0).toString();
        const yCoordsString = (touch.clientY | 0).toString();
        const coords = xCoordsString + yCoordsString;

        setTouchCoordinates((prevCoords) => prevCoords + coords);
        setLastRecordTime(now);
      }
    }
  };
  return (
    <>
      {viewSignIn ? (
        <div className="fixed left-3 top-[10vh] bg-[#6c5ce7] border-4  border-purple-950 rounded-sm right-4 p-2 flex flex-col items-center z-[10000]">
          <div className="mb-4">
            <label className="block text-white text-sm font-bold mb-2">Sign In</label>
            <input
              type="text"
              className="block w-56 p-2 mb-2 text-gray-700 border rounded text-sm"
              placeholder="Username"
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          {username.length > 3 ? (
            <>
              <div
                className="w-56 h-56 bg-blue-500"
                onTouchStart={handleTouch}
                onTouchMove={handleTouch}
              >
                Move your finger inside the blue area to generate a random number
              </div>
              <div className="relative w-56 border-b-2 border-transparent border-solid border-gradient-tr-gold-yellow-darkblue overflow-hidden">
                <div className="absolute bg-radient-ellipse-bl from-black/50 to-transparent w-full h-full" />
                <span className="absolute py-2 flex w-full h-full items-center justify-center font-philosopher text-sm text-white font-bold">
                  {Math.floor(touchCoordinates.length)} / {100}
                </span>
                <div
                  style={{
                    width: `${touchCoordinates.length}%`,
                    minHeight: 20,
                    backgroundColor: getHealthBarBackgroundColor(
                      touchCoordinates.length,
                      colors,
                    ),
                  }}
                />
              </div>
            </>
          ) : null}

          {loading && (
            <>
              <div>Loading...</div>
              <div>Aztec Info</div>
            </>
          )}
        </div>
      ) : null}
      <div className="fixed bottom-24 left-0 right-0 mx-auto flex justify-center">
        <button
          type="button"
          className={`rounded-md w-28 px-2.5 py-2 text-lg font-semibold shadow-sm bg-indigo-500 text-white`}
          onClick={() => setViewSignIn(!viewSignIn)}
        >
          Sign In
        </button>
      </div>
      {/* TODO: move this some place else */}
      <div
        className={`z-[9998] fixed bottom-2 right-2 text-sm ${connected ? "" : "animate-fade-in-out"}`}
      >
        {connected ? "✅" : "🟥"}
      </div>
    </>
  );
}

const colors = [
  "#15c621",
  "#73c615",
  "#abc615",
  "#c6c615",
  "#c6ab15",
  "#c69015",
  "#c66715",
  "#cb4015",
  "#c62e15",
  "#c61515",
];

export function getHealthBarBackgroundColor(
  percentage: number,
  healthBarColors: string[],
) {
  const healthBars = healthBarColors.map((color, index) => ({
    color,
    max: (index === 0 ? 101 : 100) - (100 / healthBarColors.length) * index,
    min: 100 - (100 / healthBarColors.length) * (index + 1),
  }));

  for (const color of healthBars) {
    if (percentage >= color.min && percentage <= color.max) return color.color;
  }

  return "#15c621";
}
