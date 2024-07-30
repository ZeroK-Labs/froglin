import { useEffect } from "react";

import { MODALS } from "enums";
import { Modal, PlayerMarkerImage } from "components";
import { ModalState } from "types";

export default function TutorialModal({ modal, setModal }: ModalState) {
  const visible = modal === MODALS.TUTORIAL;

  useEffect(
    () => {
      if (localStorage.getItem("tutorial") === "1") return;
      if (localStorage.getItem("secret")) return;

      const timerId = setTimeout(
        () => {
          localStorage.setItem("tutorial", "1");
          setModal(MODALS.TUTORIAL);
        }, //
        2_000,
      );

      return () => {
        clearTimeout(timerId);
      };
    }, //
    [],
  );

  useEffect(
    () => {
      if (visible) return;

      function handleKeyPress(ev: KeyboardEvent) {
        if (ev.key === "t") setTimeout(setModal, 0, MODALS.TUTORIAL);
      }

      document.addEventListener("keypress", handleKeyPress);

      return () => {
        document.removeEventListener("keypress", handleKeyPress);
      };
    }, //
    [visible],
  );

  return (
    <Modal
      modal={modal}
      setModal={setModal}
      className="top-4"
      icon="📖"
      title="Welcome to Froglin!"
      visible={visible}
    >
      <br />
      <div
        className="w-full flex flex-col px-3 text-sm font-semibold text-left"
        style={{ textAlign: "left" }}
      >
        <span className="text-lg">🗺️ Event View</span>
        <i>
          Overview of the play area, with general information about the ongoing event.
        </i>
        <br />
        <br />
        <span className="text-lg">🌇 Playground View </span>
        <i>
          Street view of the play area, where you can reveal, hunt and capture{" "}
          <span className="not-italic">🐸</span>.
        </i>
        <br />
        <span>
          In this view, tap your avatar image <PlayerMarkerImage size="36px" /> to open{" "}
          the ring menu with actions to perform.
        </span>
        <span>
          Play the <b>Flute</b>{" "}
          <span
            className="text-[22px] border-2 rounded-full text-[#508c52] bg-gray-400 border-solid border-gray-800 fa-brands fa-pied-piper-alt"
            style={{
              textShadow: "1px 1px 2px black",
              padding: "5px 6px 6px 2px",
            }}
          />{" "}
          to reveal Froglins around you.
        </span>
        <br />
        For the skilled hunter, a Triad of Techniques is available and performing any
        single one of them will capture a 🐸:
        <br />
        <br />
        1️⃣ - Move physically close (~5 meters) to a revealed Froglin's position
        <br />
        <i className="ml-4 font-normal">
          on mobile, use the device's location provider
          <br />
          on Desktops, use the good-old <b>w</b> <b>a</b> <b>s</b> <b>d</b> keys to
          navigate around the map
        </i>
        <br />
        2️⃣ - Place three trap-points around the map, encasing one or more Froglins
        <br />
        <i className="ml-4 font-normal">
          tap the <b>Trap</b>{" "}
          <span
            className="text-[22px] border-2 rounded-full text-[#9056b7] bg-gray-400 border-solid border-gray-800 fa-solid fa-circle-nodes"
            style={{
              textShadow: "1px 1px 2px black",
              padding: "5px 7px 6px 4px",
            }}
          />{" "}
          button from the ring menu
          <br />
          on Desktops, use the <b>space</b> key
        </i>
        <br />
        3️⃣ - Remote-pickup a Froglin (the lazy-man's way)
        <br />
        <i className="ml-4 mb-2 font-normal">
          tap a revealed <span className="not-italic">🐸</span> marker, then tap the
          green popup above its head
        </i>
      </div>
    </Modal>
  );
}
