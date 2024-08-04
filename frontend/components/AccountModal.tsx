import { useState, useEffect, useRef } from "react";

import { MODALS } from "frontend/enums";
import { Modal } from "frontend/components";
import { useModalState, usePXEState, usePlayer } from "frontend/stores";

const INPUT_KEY_LENGTH = 100;
const INPUT_TIMEOUT = 150;

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

export default function AccountModal() {
  const errorTimerIdRef = useRef<Timer>();
  const lastInputTimeRef = useRef(0);
  const inputDisabledRef = useRef(true);

  const [inputKey, setInputKey] = useState("");
  const [error, setError] = useState("");

  const { modal, setModal } = useModalState();
  const { pxeClient } = usePXEState();
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

    if (!ev.clientX || !ev.clientY) return;

    const x = Math.floor(ev.screenX);
    const y = Math.floor(ev.screenY);
    const sum = ((x + y) % 1024).toString();

    setInputKey((prev) => prev + sum);
    lastInputTimeRef.current = now;
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

  // set player's secret
  useEffect(
    () => {
      if (inputKey.length < INPUT_KEY_LENGTH) return;
      if (inputKey.length > INPUT_KEY_LENGTH) {
        setInputKey(inputKey.slice(0, INPUT_KEY_LENGTH));

        return;
      }

      setSecret(inputKey);
      setModal(MODALS.NONE);
    }, //
    [inputKey],
  );

  if (!pxeClient) return null;

  return (
    <>
      <Modal
        className="top-[10vh]"
        icon="🎫" // 🧙‍♂️ 🧝‍♂️ 👨‍💻 👨‍🚀 🦄 🧧 🛎 🎫 🎟 🧿
        title="Create Account"
        visible={modal === MODALS.ACCOUNT}
      >
        <div className="flex flex-col">
          <input
            type="text"
            className="w-56 p-2 mt-4 mb-2 border rounded text-sm text-gray-800"
            placeholder="Enter a name (min 3 characters)"
            onChange={handleUsernameChanged}
            value={username}
          />
          {error ? <label className="text-sm text-red-700">{error}</label> : null}
        </div>

        <div
          style={{
            width: "14rem",
            ...(username.length < 3
              ? {
                  height: "0rem",
                  opacity: 0,
                }
              : {
                  height: "16rem",
                  opacity: 1,
                }),
            transition: "height 500ms ease, opacity 500ms ease",
          }}
        >
          <div
            className="p-2 mt-3 h-56 flex flex-col bg-blue-500"
            {...(username.length < 3
              ? null
              : {
                  onPointerDown: handlePointerDown,
                  onPointerUp: handlePointerUp,
                  onPointerMove: handlePointerMove,
                })}
          >
            Move your finger randomly inside this blue area to generate a secret number
          </div>

          <div className="relative">
            <span className="absolute w-full h-6 text-sm font-bold flex justify-center text-white">
              {completionPercentage} / 100
            </span>

            <div
              style={{
                width: `${completionPercentage}%`,
                height: "1.5rem",
                backgroundColor: getPercentageColor(inputKey.length),
                transition: "width 300ms linear, background-color 600ms ease",
              }}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
