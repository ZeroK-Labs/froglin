import toast from "react-hot-toast";
import { useEffect, useState } from "react";

import { MODALS } from "frontend/enums";
import { Modal } from "frontend/components";
import { names } from "frontend/components/FroglinModal";
import type { SwapOfferResponse, SwapOffer } from "frontend/types";
import { useModalState, usePlayer } from "frontend/stores";

export default function NoticeBoardModal() {
  const [offers, setOffers] = useState<SwapOffer[]>([]);
  const [refetch, setRefetch] = useState<boolean>(true);

  const { modal } = useModalState();
  const { aztec, registered, traderId, stash, fetchStash } = usePlayer();

  const visible = modal === MODALS.NOTICEBOARD;

  async function handleCancel(proposalId: number) {
    if (!aztec || !registered) return;

    const toastId = toast.loading("Canceling swap offer...");

    try {
      await aztec.contracts.gateway.methods
        .cancel_swap_proposal(proposalId)
        .send()
        .wait();
      setRefetch(true);
    } catch (error) {
      console.error("Error canceling swap offer:", error);
      toast.error("Failed to cancel swap offer!", { id: toastId });
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

      setRefetch(true);
    } catch (error) {
      console.error("Error accepting swap offer:", error);
      toast.error("Failed to accept swap offer!", { id: toastId });
    }

    toast.dismiss(toastId);
  }

  useEffect(
    () => {
      async function fetchOffers() {
        if (!aztec || !registered || !visible || !refetch) return;

        fetchStash();

        const offersResponse: SwapOfferResponse[] =
          await aztec.contracts.gateway.methods.view_active_swap_proposals().simulate();

        if (!offersResponse || offersResponse.length === 0) return;

        const numberList: SwapOffer[] = [];

        for (let i = 0; i !== offersResponse.length; ++i) {
          const offer = offersResponse[i];
          if (offer.id === 101n) continue;

          numberList.push({
            trader_id: offer.trader_id,
            offered_froglin_type: Number(offer.offered_froglin_type),
            wanted_froglin_type: Number(offer.wanted_froglin_type),
            status: Number(offer.status),
            id: Number(offer.id),
          });
        }

        setOffers(numberList);
        setRefetch(false);
      }

      fetchOffers();
    }, //
    [aztec, registered, visible, refetch],
  );

  return (
    <Modal
      className="top-4"
      icon="📰"
      title="Noticeboard"
      visible={visible}
    >
      <div className="flex flex-col">
        {offers.length === 0
          ? null
          : offers.map((offer) => {
              // console.log(offer, traderId, offer.trader_id === traderId);
              return (
                <div
                  key={offer.id}
                  className="mb-2 flex flex-row"
                >
                  <div className="h-[32px] rounded-md font-extrabold flex align-middle self-center items-center justify-between bg-gray-300 text-gray-900">
                    <img
                      src={`/images/froglin${offer.offered_froglin_type}.webp`}
                      alt="Left Image"
                      width="40px"
                      height="40px"
                      className="rounded-md"
                    />

                    <span className="w-24 text-md no-text-shadow">
                      {names[offer.offered_froglin_type][0]}
                    </span>
                    <span className="text-xl">🔄</span>
                    <span className="w-24 text-md no-text-shadow">
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
                    <button
                      type="button"
                      className="rounded-lg px-2 py-1 ml-2 my-2 text-xs font-semibold shadow-sm text-white bg-red-800"
                      onClick={() => handleCancel(offer.id)}
                    >
                      Cancel
                    </button>
                  ) : (
                    <button
                      disabled={stash[offer.wanted_froglin_type] === 0}
                      type="button"
                      className={`rounded-lg px-2 py-1 ml-2 my-2 text-xs font-semibold shadow-sm text-white bg-green-600 ${stash[offer.wanted_froglin_type] === 0 ? "grayscale" : ""}`}
                      onClick={() => handleAccept(offer.id)}
                    >
                      Accept
                    </button>
                  )}
                </div>
              );
            })}
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
