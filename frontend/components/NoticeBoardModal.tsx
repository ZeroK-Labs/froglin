import { MODALS } from "frontend/enums";
import { Modal } from "frontend/components";
import { useModalState } from "frontend/stores";
import { names } from "frontend/components/FroglinModal";

export default function NoticesModal() {
  const { modal } = useModalState();

  const visible = modal === MODALS.NOTICES;

  return (
    <Modal
      className="top-4"
      title="Notice Board"
      visible={visible}
    >
      <div className="max-h-[650px] flex flex-col">
        <div
          className="w-[299px] h-[40px]
          flex items-center justify-between
        bg-gray-300 font-extrabold text-gray-900 rounded-md mb-2"
        >
          <img
            src="/images/froglin1.webp"
            alt="Left Image"
            width="40px"
            height="40px"
            className="rounded-md"
          />
          <span className="text-md no-text-shadow">{names[1][0]}</span>
          <span className="text-4xl">🗡️</span>
          <span className="text-md no-text-shadow">{names[2][0]}</span>
          <img
            src="/images/froglin2.webp"
            alt="Right Image"
            width="40px"
            height="40px"
            className="rounded-md"
          />
        </div>
        <div
          className="w-[299px] h-[40px]
          flex items-center justify-between
        bg-blue-300 font-extrabold text-gray-900 rounded-md mb-2"
        >
          <img
            src="/images/froglin1.webp"
            alt="Left Image"
            width="40px"
            height="40px"
            className="rounded-md"
          />
          <span className="text-md no-text-shadow">{names[1][0]}</span>
          <span className="text-4xl">🔄</span>
          <span className="text-md no-text-shadow">{names[2][0]}</span>
          <img
            src="/images/froglin2.webp"
            alt="Right Image"
            width="40px"
            height="40px"
            className="rounded-md"
          />
        </div>
        <div
          className="w-[299px] h-[40px]
          flex items-center justify-between
        bg-red-300 font-extrabold text-gray-900 rounded-md mb-2"
        >
          <img
            src="/images/froglin1.webp"
            alt="Left Image"
            width="40px"
            height="40px"
            className="rounded-md"
          />
          <span className="text-md no-text-shadow">{names[1][0]}</span>
          <span className="text-4xl">❤️</span>
          <span className="text-md no-text-shadow">{names[2][0]}</span>
          <img
            src="/images/froglin2.webp"
            alt="Right Image"
            width="40px"
            height="40px"
            className="rounded-md"
          />
        </div>
      </div>
    </Modal>
  );
}
