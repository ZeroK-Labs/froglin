import { Dispatch, MutableRefObject, SetStateAction, useEffect, useRef } from "react";

import { CapturedFroglinListItem } from "src/components";
import { useGameEvent } from "src/stores";

type Dispacher = Dispatch<SetStateAction<boolean>>;

export default function CapturedFroglinList() {
  const divRef = useRef<HTMLDivElement>(null);
  const itemSetActiveDispatcher = useRef<Dispacher>();

  const { capturedFroglins } = useGameEvent();

  function updateItemSetActiveDispatcher(dispatch: Dispacher) {
    if (dispatch === itemSetActiveDispatcher.current) return;

    if (itemSetActiveDispatcher.current) itemSetActiveDispatcher.current(false);

    (itemSetActiveDispatcher as MutableRefObject<Dispacher>).current = dispatch;
  }

  useEffect(
    () => {
      function handleDocumentClick(ev: MouseEvent) {
        if (divRef.current!.contains(ev.target as Node)) return;

        if (itemSetActiveDispatcher.current) itemSetActiveDispatcher.current(false);
      }

      document.addEventListener("click", handleDocumentClick);

      return () => {
        document.removeEventListener("click", handleDocumentClick);
      };
    }, //
    [],
  );

  return (
    <div
      ref={divRef}
      className="absolute top-16 mx-4 flex flex-row gap-2 flex-wrap"
      style={{
        pointerEvents: "all",
      }}
    >
      {capturedFroglins.map((froglin) => (
        <CapturedFroglinListItem
          key={froglin.id}
          item={froglin}
          updateSetActiveDispatcher={updateItemSetActiveDispatcher}
        />
      ))}
    </div>
  );
}
