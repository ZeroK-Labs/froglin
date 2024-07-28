import { useState, useEffect, useRef } from "react";

import Modal from "components/Modal";
import { TimeoutId } from "../../common/types";
import { VIEW } from "settings";
import { usePXEClient, usePlayer } from "stores";

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
  const divRef = useRef<HTMLDivElement>(null);
  const errorTimerIdRef = useRef<TimeoutId>();
  const lastInputTimeRef = useRef(0);
  const inputDisabledRef = useRef(true);

  const [inputKey, setInputKey] = useState("");
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);

  const { pxeClient } = usePXEClient();
  const { setSecret, username, setUsername } = usePlayer();

  const completionPercentage = Math.floor((inputKey.length / INPUT_KEY_LENGTH) * 100);

  function handlePointerDown() {
    inputDisabledRef.current = false;
  }

  function handlePointerUp() {
    inputDisabledRef.current = true;
  }

  function handlePointerMove(ev: React.MouseEvent) {
    if (inputDisabledRef.current) return;

    if (inputKey.length >= INPUT_KEY_LENGTH) return;

    const now = Date.now();
    if (now - lastInputTimeRef.current < INPUT_TIMEOUT) return;

    if (ev.clientX == null || ev.clientY == null) return;

    const x = Math.floor(ev.clientX).toString();
    if (inputKey.includes(x)) return;

    const y = Math.floor(ev.clientY).toString();
    if (inputKey.includes(y)) return;

    setInputKey((prevCoords) => prevCoords + x + y);
    lastInputTimeRef.current = now;
  }

  function handleCreateButtonClick(ev: React.MouseEvent) {
    setVisible(true);
    ev.stopPropagation();
  }

  function handleUsernameChanged(ev: React.ChangeEvent<HTMLInputElement>) {
    const name = ev.target.value;

    let error = "";
    if (!/^[a-zA-Z0-9]*$/.test(name)) error = "Only letters and digits";
    else if (name.length > 31) error = "Max 32 characters";
    else setUsername(name);

    if (!error) return;

    setError(error);
    clearTimeout(errorTimerIdRef.current);

    errorTimerIdRef.current = setTimeout(
      () => {
        setError("");
        errorTimerIdRef.current = undefined;
      }, //
      3_000,
    );
  }

  function handleClose(ev: MouseEvent | React.BaseSyntheticEvent) {
    if (
      !(ev.target instanceof HTMLButtonElement) &&
      divRef.current &&
      divRef.current.contains(ev.target as Node)
    ) {
      return;
    }

    setVisible(false);
  }

  useEffect(
    () => {
      if (inputKey.length < INPUT_KEY_LENGTH) return;
      if (inputKey.length > INPUT_KEY_LENGTH) {
        setInputKey(inputKey.slice(0, INPUT_KEY_LENGTH));

        return;
      }

      setSecret(inputKey);
    }, //
    [inputKey],
  );

  if (!pxeClient) return null;

  return (
    <>
      <Modal
        isOpen={visible}
        setIsOpen={setVisible}
      >
        <div className="z-[9999] fixed left-4 right-4 p-2 top-[10vh] border-4 rounded-sm flex flex-col items-center border-main-purple bg-[#6c5ce7]">
          <button
            className="absolute right-3 top-1 text-xl fa-solid fa-xmark drop-shadow-md shadow-gray-600 cursor-pointer"
            onClick={handleClose}
          />

          <label className="mb-4 text-md font-bold text-white">Create Account</label>

          <input
            type="text"
            className="w-56 p-2 mb-2 border rounded text-sm text-gray-800"
            placeholder="Enter a name (min 3 characters)"
            onChange={handleUsernameChanged}
            value={username}
          />
          {error ? <label className="text-sm text-red-700">{error}</label> : null}

          {username.length > 2 ? (
            <>
              <div
                className="w-56 h-56 p-2 mt-2 bg-blue-500"
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
      </Modal>

      <div
        className="fixed bottom-24 left-1/2 translate-x-[-50%] flex justify-center transition-opacity"
        style={{
          opacity: visible ? 0 : 1,
          pointerEvents: visible ? "none" : "auto",
          transitionDuration: `${VIEW.TUTORIAL_FADE_ANIMATION_DURATION}ms`,
        }}
      >
        <button
          type="button"
          className={`rounded-md px-2.5 py-2 text-lg font-semibold shadow-sm bg-indigo-500 text-white`}
          onClick={handleCreateButtonClick}
        >
          Create Account
        </button>
      </div>
    </>
  );
}
