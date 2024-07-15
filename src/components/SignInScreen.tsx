import { useState, useEffect, useRef } from "react";
import { AccountManager } from "@aztec/aztec.js/account";
import { SingleKeyAccountContract } from "@aztec/accounts/single_key";
import { Fr, deriveMasterIncomingViewingSecretKey } from "@aztec/aztec.js";

import { usePXEClient } from "stores";
import { stringToBigInt } from "utils/math";

const INPUT_KEY_LENGTH = 100;
const INPUT_TIMEOUT = 250;

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

function getPercentageColor(percentage: number) {
  const healthBars = colors.map((color, index) => ({
    color,
    min: INPUT_KEY_LENGTH - (INPUT_KEY_LENGTH / colors.length) * (index + 1),
    max:
      INPUT_KEY_LENGTH +
      (index === 0 ? 1 : 0) -
      (INPUT_KEY_LENGTH / colors.length) * index,
  }));

  for (const color of healthBars) {
    if (percentage >= color.min && percentage <= color.max) return color.color;
  }

  return "#15c621";
}

export default function SignInScreen({ setUser }: { setUser: (a: boolean) => void }) {
  const lastInputTime = useRef(0);
  const inputDisabled = useRef(true);

  const [inputKey, setInputKey] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  const { connected, pxeClient } = usePXEClient();

  const completionPercentage = Math.floor((inputKey.length / INPUT_KEY_LENGTH) * 100);

  function handlePointerDown() {
    inputDisabled.current = false;
  }

  function handlePointerUp() {
    inputDisabled.current = true;
  }

  function handlePointerMove(ev: React.MouseEvent) {
    if (inputDisabled.current) return;

    if (inputKey.length >= INPUT_KEY_LENGTH) return;

    const now = Date.now();
    if (now - lastInputTime.current < INPUT_TIMEOUT) return;

    if (ev.clientX == null || ev.clientY == null) return;

    const x = Math.floor(ev.clientX).toString();
    if (inputKey.includes(x)) return;

    const y = Math.floor(ev.clientY).toString();
    if (inputKey.includes(y)) return;

    setInputKey((prevCoords) => prevCoords + x + y);
    lastInputTime.current = now;
  }

  function handleSignInClick() {
    setVisible(!visible);
  }

  function handleUsernameChanged(ev: React.ChangeEvent<HTMLInputElement>) {
    setUsername(ev.target.value);
  }

  useEffect(
    () => {
      if (inputKey.length < INPUT_KEY_LENGTH) return;
      if (inputKey.length > INPUT_KEY_LENGTH) {
        setInputKey(inputKey.slice(0, INPUT_KEY_LENGTH));

        return;
      }

      // TODO: uncomment this when we deploy the sandbox
      // if (!pxeClient) return;

      setLoading(true);

      async function registerAccount() {
        const secretKey = stringToBigInt(inputKey);
        const keyFr = new Fr(secretKey);
        const encryptionPrivateKey = deriveMasterIncomingViewingSecretKey(keyFr);

        localStorage.setItem("user", JSON.stringify(encryptionPrivateKey));

        const accountContract = new SingleKeyAccountContract(encryptionPrivateKey);
        const accountManager = new AccountManager(pxeClient, keyFr, accountContract);
        const wallet = await accountManager.register();
        if (!wallet) return;

        setTimeout(() => {
          setUser(true);
          setLoading(false);
        }, 3_000);
      }

      registerAccount();
    }, //
    [inputKey],
  );

  return (
    <>
      {visible ? (
        <div className="fixed left-3 top-[10vh] bg-[#6c5ce7] border-4  border-purple-950 rounded-sm right-4 p-2 flex flex-col items-center z-[10000]">
          <div className="mb-4">
            <label className="block text-white text-sm font-bold mb-2">Sign In</label>

            <input
              type="text"
              className="block w-56 p-2 mb-2 text-gray-700 border rounded text-sm"
              placeholder="Username (min 3 characters)"
              onChange={handleUsernameChanged}
            />
          </div>

          {username.length > 2 ? (
            <>
              <div
                className="w-56 h-56 bg-blue-500"
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerMove={handlePointerMove}
              >
                Move your finger inside the blue area to generate a random number
              </div>

              <div className="relative w-56 border-b-2 border-transparent border-solid border-gradient-tr-gold-yellow-darkblue overflow-hidden">
                <div className="absolute bg-radient-ellipse-bl from-black/50 to-transparent w-full h-full" />

                <span className="absolute py-2 flex w-full h-full items-center justify-center font-philosopher text-sm text-white font-bold">
                  {completionPercentage} / 100
                </span>

                <div
                  style={{
                    width: `${completionPercentage}%`,
                    minHeight: 20,
                    backgroundColor: getPercentageColor(inputKey.length),
                  }}
                />
              </div>
            </>
          ) : null}

          {loading ? (
            <>
              <br />
              <div>Creating Wallet and registering new player with username</div>
              <code>{username}</code>
              <div>
                in contract <code>storage</code> as a
              </div>
              <code>{"PrivateMutable<ValueNote>"}</code>
            </>
          ) : null}
        </div>
      ) : null}

      {connected ? (
        <div className="fixed bottom-24 left-0 right-0 mx-auto flex justify-center">
          <button
            type="button"
            className={`rounded-md w-28 px-2.5 py-2 text-lg font-semibold shadow-sm bg-indigo-500 text-white`}
            onClick={handleSignInClick}
          >
            Sign In
          </button>
        </div>
      ) : null}

      {/* TODO: move this some place else */}
      <div
        className={`z-[9998] fixed bottom-2 right-2 text-sm text-red-600 ${connected ? "" : "animate-fade-in-out"}`}
      >
        {connected ? "✅" : "PXE is not connected 🟥"}
      </div>
    </>
  );
}
