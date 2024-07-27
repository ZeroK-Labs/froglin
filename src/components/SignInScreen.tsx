import { useState, useEffect, useRef } from "react";

import { usePXEClient, useAccountWithContracts } from "stores";

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

export default function SignInScreen() {
  const lastInputTime = useRef(0);
  const inputDisabled = useRef(true);

  const [inputKey, setInputKey] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<string>("");

  const { pxeClient } = usePXEClient();
  const { setIsFormReady, setUsername } = useAccountWithContracts();

  const isSecret: boolean = !!localStorage.getItem("user");

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
    const newValue = ev.target.value;
    if (!/^[a-zA-Z0-9]*$/.test(newValue)) {
      setError("Username must contain only letters and digits.");
    } else if (user.length > 31) {
      setError("Username must be max 32 long.");
    } else {
      setError("");
      setUser(newValue);
    }
  }

  // useEffect(
  //   () => {
  //     const secretString = localStorage.getItem("user");
  //     if (!secretString) return;

  //     setUser(true);
  //     console.log("User loaded from localStorage");
  //   }, //
  //   [],
  // );

  useEffect(
    () => {
      if (inputKey.length < INPUT_KEY_LENGTH) return;
      if (inputKey.length > INPUT_KEY_LENGTH) {
        setInputKey(inputKey.slice(0, INPUT_KEY_LENGTH));

        return;
      }
      if (!pxeClient) return;

      // const secretKey = stringToBigInt(inputKey);

      localStorage.setItem("user", inputKey.toString());
      setUsername(user);
      setIsFormReady(true);
    }, //
    [inputKey],
  );

  return (
    <>
      {visible ? (
        <div className="fixed left-3 top-[10vh] bg-[#6c5ce7] border-4 border-purple-950 rounded-sm right-4 p-2 flex flex-col items-center z-[10000]">
          <div className="flex flex-col items-center mb-4">
            <label className="text-white text-sm font-bold mb-2">Sign In</label>

            <input
              type="text"
              className="w-56 p-2 mb-2 text-gray-700 border rounded text-sm"
              placeholder="Username (min 3 characters)"
              onChange={handleUsernameChanged}
              value={user}
            />
            <label className="text-xs text-red-500 min-h-5">{error}</label>
          </div>

          {user.length > 2 ? (
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
        </div>
      ) : null}

      {pxeClient && !isSecret ? (
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
    </>
  );
}
