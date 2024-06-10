import { useEffect } from "react";

export default function Tutorial({
  setTutorial,
}: {
  setTutorial: (b: boolean) => void;
}) {
  function handleClick() {
    setTutorial(false);
  }

  useEffect(() => {
    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <div className={`fixed left-10 top-[20vh] right-10 p-2 flex z-[10000]`}>
      <div
        className="absolute top-2 p-2 mb-8 border-4 bg-[#6c5ce7] text-gray-800 drop-shadow-md shadow-gray-400 border-purple-950"
        style={{ width: "calc(100% - 1rem)" }}
      >
        <div
          className="flex justify-end px-2"
          onClick={handleClick}
        >
          <p className="text-lg fa-solid fa-xmark" />
        </div>
        <div className="mb-2 text-2xl font-bold justify-center">
          👋 Welcome to Froglin!
        </div>
        <br />
        <div className="flex flex-col w-full text-left px-3 font-semibold">
          <p className="text-base">🗺️ Event View {"<=>"} Playground View 🌇</p>
          <br />
          <p className="text-base">
            Tap your Avatar to open a ring menu with actions you can perform.
            <br />
            <br />
            Play the Flute{" "}
            <span className="text-[20px] px-0.5 py-1 bg-gray-400 text-[#508c52] rounded-full border-[1px] border-solid border-gray-800 fa-brands fa-pied-piper-alt" />{" "}
            to reveal Froglins around you.
          </p>
          <br />
          <p className="text-base">Capture 🐸 in 3 ways:</p>
          <p>
            - Move physically close (5 meters) to a revealed Froglin{" "}
            <span className="font-normal">
              (use the arrow-keys or the good-old <b>w</b> <b>a</b> <b>s</b>{" "}
              <b>d</b> keys on the desktop)
            </span>
          </p>
          <p>
            - Place 3 traps around a Froglin{" "}
            <span className="font-normal">
              (use the <b>space-key</b> to place or tap the Trap{" "}
              <span className="text-[20px] p-1 bg-gray-400 text-[#9056b7] rounded-full border-[1px] border-solid border-gray-800 fa-solid fa-circle-nodes" />{" "}
              button from the ring menu)
            </span>
          </p>
          <p>
            - Click on the Froglins popup{" "}
            <span className="font-normal">
              (the lazy-man's way to pick up a Froglin)
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
