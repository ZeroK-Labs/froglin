import { useEffect, useState } from "react";
import { MODALS } from "frontend/enums";
import { Modal } from "frontend/components";
import { useModalState, usePlayer } from "frontend/stores";
import { names } from "frontend/components/FroglinModal";

type Offer = {
  trader_id: number;
  offered_froglin_type: number;
  wanted_froglin_type: number;
  status: number;
  id: number;
};

export default function NoticesModal() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const { modal } = useModalState();
  const { aztec, registered } = usePlayer();
  console.log("offers", offers);
  const visible = modal === MODALS.NOTICES;
  useEffect(
    () => {
      async function fetchLeaderBoard() {
        if (!aztec || !registered || !visible) return;

        const offersResponse = await aztec.contracts.gateway.methods
          .view_active_swap_proposals()
          .simulate();

        if (!offersResponse || offersResponse.length === 0) return;

        const numberList: Offer[] = [];

        offersResponse.forEach(
          ({
            trader_id,
            offered_froglin_type,
            wanted_froglin_type,
            status,
            id,
          }: {
            trader_id: bigint;
            offered_froglin_type: bigint;
            wanted_froglin_type: bigint;
            status: bigint;
            id: bigint;
          }) => {
            if (id !== 101n) {
              numberList.push({
                trader_id: Number(trader_id),
                offered_froglin_type: Number(offered_froglin_type),
                wanted_froglin_type: Number(wanted_froglin_type),
                status: Number(status),
                id: Number(id),
              });
            }
          },
        );
        setOffers(numberList);
      }

      fetchLeaderBoard();
    }, //
    [aztec, registered, visible],
  );

  return (
    <Modal
      className="top-4"
      title="Board"
      visible={visible}
    >
      <div className="max-h-[650px] flex flex-col">
        {offers.length > 0
          ? offers.map((offer) => {
              console.log("offer", offer);
              return (
                <div
                  key={offer.id}
                  className="w-[299px] h-[40px]
            flex items-center justify-between
          bg-gray-300 font-extrabold text-gray-900 rounded-md mb-2"
                >
                  <img
                    src={`/images/froglin${offer.offered_froglin_type}.webp`}
                    alt="Left Image"
                    width="40px"
                    height="40px"
                    className="rounded-md"
                  />
                  <span className="text-md no-text-shadow">
                    {names[offer.offered_froglin_type][0]}
                  </span>
                  <span className="text-4xl">🔄</span>
                  <span className="text-md no-text-shadow">
                    {names[offer.wanted_froglin_type][0]}
                  </span>
                  <img
                    src={`/images/froglin${offer.wanted_froglin_type}.webp`}
                    alt="Right Image"
                    width="40px"
                    height="40px"
                    className="rounded-md"
                  />
                </div>
              );
            })
          : null}
        {/* <div
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
        </div> */}
      </div>
    </Modal>
  );
}
