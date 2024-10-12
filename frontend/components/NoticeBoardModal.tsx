import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { MODALS } from "frontend/enums";
import { Modal } from "frontend/components";
import { useModalState, usePlayer } from "frontend/stores";
import { names } from "frontend/components/FroglinModal";

export type Offer = {
  trader_id: bigint;
  offered_froglin_type: number;
  wanted_froglin_type: number;
  status: number;
  id: number;
};

export default function NoticesModal() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [refetch, setRefetch] = useState<boolean>(false);
  const { modal } = useModalState();
  const { aztec, registered, traderId } = usePlayer();

  const visible = modal === MODALS.NOTICES;

  async function handleCancel(proposalId: number) {
    if (!aztec || !registered) return;
    const toastId = toast.loading("Canceling swap offer...");
    try {
      await aztec.contracts.gateway.methods
        .cancel_swap_proposal(proposalId)
        .send()
        .wait();
      setRefetch(!refetch);
    } catch (error) {
      toast.error("Failed to cancel swap offer!", { id: toastId });
      console.error("Error canceling swap offer:", error);
    }
    toast.dismiss(toastId);
  }

  async function handleAccept(proposalId: number) {
    if (!aztec || !registered) return;
    const toastId = toast.loading("Accepting swap offer...");
    try {
      await aztec.contracts.gateway.methods
        .accept_swap_proposal(proposalId)
        .send()
        .wait();

      setRefetch(!refetch);
    } catch (error) {
      toast.error("Failed to accept swap offer!", { id: toastId });
      console.error("Error accepting swap offer:", error);
    }
    toast.dismiss(toastId);
  }

  useEffect(
    () => {
      async function fetchOffers() {
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
                trader_id,
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

      fetchOffers();
    }, //
    [aztec, registered, visible, refetch],
  );

  return (
    <Modal
      className="top-4"
      title="Notice Board"
      visible={visible}
    >
      <div className="max-h-[650px] flex flex-col">
        {offers.length > 0
          ? offers.map((offer) => {
              console.log(offer, traderId, offer.trader_id === traderId);
              return (
                <div
                  key={offer.id}
                  className="flex flex-row gap-2"
                >
                  <div
                    className="w-[320px] h-[40px]
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
                    <span className="text-md no-text-shadow w-24">
                      {names[offer.offered_froglin_type][0]}
                    </span>
                    <span className="text-4xl">🔄</span>
                    <span className="text-md no-text-shadow w-24">
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
                  {offer.trader_id === traderId ? (
                    <div>
                      <button
                        type="button"
                        className="rounded-lg px-2 py-1 my-2 text-[10px] font-semibold shadow-sm text-white bg-red-800"
                        onClick={() => handleCancel(offer.id)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    // TODO: render if the player has the necessary froglin
                    <div>
                      <button
                        type="button"
                        className="rounded-lg px-2 py-1 my-2 text-[10px] font-semibold shadow-sm text-white bg-green-600"
                        onClick={() => handleAccept(offer.id)}
                      >
                        Accept
                      </button>
                    </div>
                  )}
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
