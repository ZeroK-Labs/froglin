import { MODALS } from "frontend/enums";
import { Modal } from "frontend/components";
import { useModalState } from "frontend/stores";
import { names } from "frontend/components/FroglinModal";

export default function ClaimsModal() {
  const { modal } = useModalState();

  const visible = modal === MODALS.CLAIMS;

  return (
    <Modal
      className="top-4"
      title="Claims"
      visible={visible}
    >
      <div className="max-h-[650px] flex flex-col">
        <div
          className="w-[299px] h-[40px]
          flex items-center justify-between
        bg-gray-300 font-extrabold text-gray-900 rounded-md mb-2"
        >
          <div className="flex flex-row items-center gap-2">
            <img
              src="/images/froglin1.webp"
              alt="Left Image"
              width="40px"
              height="40px"
              className="rounded-md"
            />
            <span className="text-sm no-text-shadow">{names[1][0]}</span>
          </div>

          <span className="text-sm font-semibold no-text-shadow mr-4">
            Won in battle
          </span>
        </div>
      </div>
    </Modal>
  );
}
