import toast from "react-hot-toast";
import { useEffect, useState } from "react";

import type { SwapOfferResponse, Proposal } from "frontend/types";
import { MODALS } from "frontend/enums";
import { BattleOptionBox, Modal } from "frontend/components";
import { names } from "frontend/components/FroglinModal";
import { useModalState, usePlayer } from "frontend/stores";
import { FroglinMenuButton } from "./FroglinMenuButton";
import { CLIENT_SOCKET } from "frontend/utils/sockets";

export default function NoticeBoardModal() {
  const [offers, setOffers] = useState<Proposal[]>([]);
  const [refetch, setRefetch] = useState<boolean>(true);
  const [choices, setChoices] = useState<number[]>([0, 0, 0]);
  const [makeChoices, setMakeChoices] = useState<boolean>(false);

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

  async function acceptBattle(proposalId: number) {
    if (!aztec || !registered) return;

    const toastId = toast.loading("Accepting battle offer...");
    const battleNumber = choices.reduce((acc, choice) => acc * 10 + choice, 0);
    try {
      await aztec.contracts.gateway.methods
        .accept_battle_proposal(proposalId, battleNumber)
        .send()
        .wait();

      CLIENT_SOCKET.send(JSON.stringify({ message: "battle", proposalId }));

      setRefetch(true);
    } catch (error) {
      console.error("Error accepting battle offer:", error);
      toast.error("Failed to accept battle offer!", { id: toastId });
    }
    setMakeChoices(false);

    toast.dismiss(toastId);
  }

  async function handleAcceptProposal(proposalId: number, type: string) {
    if (!aztec || !registered) return;

    const toastId = toast.loading(`Accepting ${type} offer...`);

    try {
      if (type === "battle") {
        // render choices
        setMakeChoices(true);
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
                <div>
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
                        onClick={() => handleAcceptProposal(offer.id, offer.type)}
                      >
                        Accept
                      </button>
                    )}
                  </div>
                  {makeChoices ? (
                    <div>
                      <div className="flex flex-row justify-between items-center gap-4 pb-8">
                        <div>
                          <span className="text-center">Round 1</span>
                          <BattleOptionBox
                            box={1}
                            setChoices={setChoices}
                            choices={choices}
                            currentOption={choices[0] ?? ""}
                          />
                        </div>
                        <div>
                          <span className="text-center">Round 2</span>
                          <BattleOptionBox
                            box={2}
                            setChoices={setChoices}
                            choices={choices}
                            currentOption={choices[1] ?? ""}
                          />
                        </div>
                        <div>
                          <span className="text-center">Round 3</span>
                          <BattleOptionBox
                            box={3}
                            setChoices={setChoices}
                            choices={choices}
                            currentOption={choices[2] ?? ""}
                          />
                        </div>
                      </div>
                      <FroglinMenuButton
                        className="bg-gray-900"
                        icon="🗡️"
                        text="Send to Battle"
                        onClick={() => acceptBattle(offer.id)}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
      </div>
    </Modal>
  );
}
