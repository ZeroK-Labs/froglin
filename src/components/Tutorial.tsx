import { useEffect, useRef } from "react";

import { TutorialState } from "types";
import Modal from "components/Modal";

export default function Tutorial({ tutorial, setTutorial }: TutorialState) {
  const divRef = useRef<HTMLDivElement>(null);

  function handleClose(ev: MouseEvent | React.BaseSyntheticEvent) {
    if (
      !(ev.target instanceof HTMLButtonElement) &&
      divRef.current &&
      divRef.current.contains(ev.target as Node)
    ) {
      return;
    }

    setTutorial(false);
  }

  useEffect(
    () => {
      if (!tutorial) return;

      document.addEventListener("click", handleClose);

      return () => {
        document.removeEventListener("click", handleClose);
      };
    }, //
    [tutorial],
  );

  return (
    <Modal
      isOpen={tutorial}
      setIsOpen={setTutorial}
      borderColor="#000764"
    >
      <p className="absolute left-2 top-2 text-xl drop-shadow-md shadow-gray-400">👋</p>
      <p className="mb-3 text-2xl font-bold justify-center drop-shadow-md shadow-gray-400">
        Welcome to Froglin!
      </p>
      <button
        className="absolute right-3 top-1 text-xl cursor-pointer fa-solid fa-xmark text-re drop-shadow-md shadow-gray-600"
        onClick={handleClose}
      />
      <br />
      <div
        className="flex flex-col w-full text-left px-3 font-semibold drop-shadow-md shadow-gray-400"
        style={{ textAlign: "justify" }}
      >
        <p className="text-lg">🗺️ Event View</p>
        <i className="text-sm">
          Overview of the play area, with general information about the ongoing event.
        </i>
        <br />
        <p className="text-lg">🌇 Playground View </p>
        <p className="text-sm">
          <i>Street view of the play area, where you can reveal, hunt and capture </i>
          🐸.
          <br />
          <br />
          In this view, tap your avatar image to open the ring menu with actions to
          perform.
          <br />
          <br />
          Play the <b>Flute</b>{" "}
          <span className="text-[20px] px-0.5 py-1 bg-gray-400 text-[#508c52] rounded-full border-[1px] border-solid border-gray-800 fa-brands fa-pied-piper-alt" />{" "}
          to reveal Froglins around you.
          <br />
          <br />
          For the skilled hunter, a Triad of Techniques is available and performing any
          single one of them will capture a 🐸:
          <br />
          <br />
          1️⃣ - Move physically close (5 meters) to a revealed Froglin's position{" "}
          <span className="font-normal">
            (using device's location provider on mobile; for Desktops, use the good-old{" "}
            <b>w</b> <b>a</b> <b>s</b> <b>d</b> keys to navigate around the map)
          </span>
          <br />
          <br />
          2️⃣ - Place three trap-points around the map, encasing one or more Froglins{" "}
          <span className="font-normal">
            (tap the <b>Trap</b>{" "}
            <span className="text-[20px] p-1 bg-gray-400 text-[#9056b7] rounded-full border-[1px] border-solid border-gray-800 fa-solid fa-circle-nodes" />{" "}
            button from the ring menu on mobiles; for Desktops, use the <b>space</b> key
            to place a trap)
          </span>
          <br />
          <br />
          3️⃣ - Tap on a 🐸, then tap the green popup above its head{" "}
          <span className="font-normal">
            (the lazy-man's way to remote-pickup a Froglin)
          </span>
        </p>
      </div>
    </Modal>
  );
}
