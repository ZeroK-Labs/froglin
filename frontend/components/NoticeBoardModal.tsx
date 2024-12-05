import toast from "react-hot-toast";
import { useEffect, useState } from "react";

import type { SwapOfferResponse, Proposal } from "frontend/types";
import { MODALS } from "frontend/enums";
import { Modal } from "frontend/components";
import { names } from "frontend/components/FroglinModal";
import { useModalState, usePlayer } from "frontend/stores";

export default function NoticeBoardModal() {
  const [offers, setOffers] = useState<Proposal[]>([]);
  const [refetch, setRefetch] = useState<boolean>(true);

  const { modal } = useModalState();
  const { aztec, registered, traderId, stash, fetchStash } = usePlayer();

  const visible = modal === MODALS.NOTICEBOARD;

  async function handleCancel(proposalId: number, type: string) {
    if (!aztec || !registered) return;

    const toastId = toast.loading(`Canceling ${type} offer...`);

    try {
      if (type === "battle") {
        await aztec.contracts.gateway.methods
          .cancel_battle_proposal(proposalId)
          .send()
          .wait();
      }
      if (type === "swap") {
        await aztec.contracts.gateway.methods
          .cancel_swap_proposal(proposalId)
          .send()
          .wait();
      }

      setRefetch(true);
    } catch (error) {
      console.error(`Error canceling ${type} offer:`, error);
      toast.error(`Failed to cancel ${type} offer!`, { id: toastId });
    }

    toast.dismiss(toastId);
  }

  async function handleAccept(proposalId: number, type: string) {
    if (!aztec || !registered) return;

    const toastId = toast.loading(`Accepting ${type} offer...`);

    try {
      if (type === "battle") {
        // open battle modal
        // await aztec.contracts.gateway.methods
        //   .accept_battle_proposal(proposalId)
        //   .send()
        //   .wait();
      }
      if (type === "swap") {
        await aztec.contracts.gateway.methods
          .accept_swap_proposal(proposalId)
          .send()
          .wait();
      }

      setRefetch(true);
    } catch (error) {
      console.error(`Error accepting ${type} offer:`, error);
      toast.error(`Failed to accept ${type} offer!`, { id: toastId });
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
        const battlesResponse = await aztec.contracts.gateway.methods
          .view_active_battle_proposals()
          .simulate();

        if (
          !offersResponse ||
          offersResponse.length === 0 ||
          !battlesResponse ||
          battlesResponse.length === 0
        )
          return;

        const numberList: Proposal[] = [];

        for (let i = 0; i !== offersResponse.length; ++i) {
          const offer = offersResponse[i];
          if (offer.id === 101n) continue;

          numberList.push({
            trader_id: offer.trader_id,
            offered_froglin_type: Number(offer.offered_froglin_type),
            wanted_froglin_type: Number(offer.wanted_froglin_type),
            status: Number(offer.status),
            id: Number(offer.id),
            type: "swap",
          });
        }
        for (let i = 0; i !== battlesResponse.length; ++i) {
          const offer = battlesResponse[i];
          if (offer.id === 101n) continue;

          numberList.push({
            trader_id: offer.trader_id,
            offered_froglin_type: Number(offer.offered_froglin_type),
            wanted_froglin_type: Number(offer.wanted_froglin_type),
            status: Number(offer.status),
            id: Number(offer.id),
            type: "battle",
          });
        }

        setOffers(numberList);
        setRefetch(false);
      }

      fetchOffers();
    }, //
    [aztec, registered, visible, refetch],
  );

  function offerType(type: string) {
    return type === "swap" ? "🔄" : type === "battle" ? "🗡️" : "❤️";
  }

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
                    <span className="text-xl">{offerType(offer.type)}</span>
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
                      onClick={() => handleCancel(offer.id, offer.type)}
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
