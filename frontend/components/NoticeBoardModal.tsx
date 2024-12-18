import toast from "react-hot-toast";
import { useEffect, useState } from "react";

import type { SwapOfferResponse } from "frontend/types";
import type { Proposal, DateProposal } from "frontend/types/Proposals";
import { MODALS } from "frontend/enums";
import { BattleOptionBox, Modal, SpinOptionBox } from "frontend/components";
import { names } from "frontend/components/FroglinModal";
import { useModalState, usePlayer } from "frontend/stores";
import { FroglinMenuButton } from "./FroglinMenuButton";
import { CLIENT_SOCKET } from "frontend/utils/sockets";

export default function NoticeBoardModal() {
  const [offers, setOffers] = useState<Proposal[]>([]);
  const [dates, setDates] = useState<DateProposal[]>([]);
  const [refetch, setRefetch] = useState<boolean>(true);
  const [choices, setChoices] = useState<number[]>([0, 0, 0]);
  const [selectedProposal, setSelectedProposal] = useState<{
    id: number | null;
    type: "battle" | "date" | null;
  }>({ id: null, type: null });
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [datingFroglin, setDatingFroglin] = useState<number | null>(null);
  const { modal } = useModalState();
  const { aztec, registered, traderId, stash, fetchStash } = usePlayer();

  const visible = modal === MODALS.NOTICEBOARD;

  function handleSpinAndGo() {
    setIsSpinning(true);
    setTimeout(() => {
      setIsSpinning(false);
    }, 3000);
  }

  useEffect(() => {
    // validate choices
    if (
      !choices.includes(0) &&
      !isSpinning &&
      selectedProposal.type === "date" &&
      selectedProposal.id !== null &&
      datingFroglin !== null
    ) {
      acceptDate(selectedProposal.id);
    }
  }, [choices, isSpinning]);

  function changeFroglin(e: React.MouseEvent, offered_froglin_type: number) {
    const offset = names.length / 2;

    setDatingFroglin((prev) => {
      let rangeStart: number;
      let rangeEnd: number;

      if (offered_froglin_type < offset) {
        rangeStart = offset;
        rangeEnd = names.length - 1;
      } else {
        rangeStart = 0;
        rangeEnd = offset - 1;
      }

      let next =
        prev === null || prev < rangeStart || prev > rangeEnd ? rangeStart : prev + 1;

      if (next > rangeEnd) {
        next = rangeStart;
      }

      return next;
    });
    e.stopPropagation();
  }

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
      if (type === "date") {
        await aztec.contracts.gateway.methods
          .cancel_date_proposal(proposalId)
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

    toast.success(`Canceled`, { id: toastId });
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
      if (error instanceof Error) {
        toast.error(`Failed to accept battle offer! ${error.message}`, { id: toastId });
      } else {
        toast.error(`Failed to accept battle offer!`, { id: toastId });
      }
    } finally {
      toast.dismiss(toastId);
      setSelectedProposal({ id: null, type: null });
    }
  }

  async function acceptDate(proposalId: number) {
    if (!aztec || !registered || datingFroglin === null) return;

    const toastId = toast.loading("Accepting date offer...");
    const dateNumber = choices.reduce((acc, choice) => acc * 10 + choice, 0);

    try {
      await aztec.contracts.gateway.methods
        .accept_date_proposal(proposalId, datingFroglin, dateNumber)
        .send()
        .wait();

      CLIENT_SOCKET.send(JSON.stringify({ message: "date", proposalId }));

      setRefetch(true);
    } catch (error) {
      console.error("Error accepting date offer:", error);
      if (error instanceof Error) {
        toast.error(`Failed to accept date offer! ${error.message}`, { id: toastId });
      } else {
        toast.error(`Failed to accept date offer!`, { id: toastId });
      }
    } finally {
      toast.dismiss(toastId);
      setChoices([0, 0, 0]);
      setSelectedProposal({ id: null, type: null });
    }
  }

  async function handleAcceptProposal(proposalId: number, type: string) {
    if (!aztec || !registered) return;
    let toastId = "";
    try {
      if (["battle", "date"].includes(type)) {
        // render choices
        setSelectedProposal({ id: proposalId, type: type as "battle" | "date" });
      }
      if (type === "swap") {
        toastId = toast.loading(`Accepting ${type} offer...`);
        await aztec.contracts.gateway.methods
          .accept_swap_proposal(proposalId)
          .send()
          .wait();
        toast.success(`Accepted`, { id: toastId });
      }

      setRefetch(true);
    } catch (error) {
      console.error(`Error accepting ${type} offer:`, error);
      toast.error(`Failed to accept ${type} offer!`, { id: toastId });
    }
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

      async function fetchDates() {
        if (!aztec || !registered || !visible || !refetch) return;

        const activeDatesResponse = await aztec.contracts.gateway.methods
          .view_active_date_proposals()
          .simulate();
        if (!activeDatesResponse || activeDatesResponse.length === 0) return;
        const numberList: DateProposal[] = [];
        for (let i = 0; i !== activeDatesResponse.length; ++i) {
          const date = activeDatesResponse[i];
          if (date.id === 101n) continue;

          numberList.push({
            trader_id: date.trader_id,
            offered_froglin_type: Number(date.offered_froglin_type),
            status: Number(date.status),
            id: Number(date.id),
            type: "date",
          });
        }
        setDates(numberList);
      }
      fetchDates();
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
                <div key={offer.id}>
                  <div className="mb-2 flex flex-row">
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
                    ) : selectedProposal.id === offer.id &&
                      selectedProposal.type === "battle" ? (
                      <button
                        type="button"
                        className={`rounded-lg px-2 py-1 ml-2 my-2 text-xs font-semibold shadow-sm text-white bg-red-800`}
                        onClick={() => {
                          setSelectedProposal({ id: null, type: null });
                          setChoices([0, 0, 0]);
                        }}
                      >
                        Close
                      </button>
                    ) : (
                      <button
                        disabled={stash[offer.wanted_froglin_type] === 0}
                        type="button"
                        className={`rounded-lg px-2 py-1 ml-2 my-2 text-xs font-semibold shadow-sm text-white bg-green-600 ${stash[offer.wanted_froglin_type] === 0 ? "grayscale" : ""}`}
                        onClick={() => handleAcceptProposal(offer.id, offer.type)}
                      >
                        {offer.type === "swap" ? "Swap!" : "Battle!"}
                      </button>
                    )}
                  </div>
                  {selectedProposal.id === offer.id &&
                  selectedProposal.type === "battle" ? (
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
        {dates.length === 0
          ? null
          : dates.map((date) => {
              return (
                <div key={date.id}>
                  <div className="mb-2 flex flex-row">
                    <div className="h-[32px] rounded-md font-extrabold flex align-middle self-center items-center justify-between bg-gray-300 text-gray-900">
                      <img
                        src={`/images/froglin${date.offered_froglin_type}.webp`}
                        alt="Left Image"
                        width="40px"
                        height="40px"
                        className="rounded-md"
                      />

                      <span className="w-24 text-md no-text-shadow">
                        {names[date.offered_froglin_type][0]}
                      </span>
                      <span className="text-xl">{offerType(date.type)}</span>
                      <span className="w-24 text-md no-text-shadow" />
                      {/* <img
                        src={`/images/froglin0.webp`}
                        alt="Invisible Right Image"
                        width="40px"
                        height="40px"
                        className="rounded-md invisible"
                      /> */}
                    </div>

                    {date.trader_id === traderId ? (
                      <button
                        type="button"
                        className="rounded-lg px-2 py-1 ml-2 my-2 text-xs font-semibold shadow-sm text-white bg-red-800"
                        onClick={() => handleCancel(date.id, date.type)}
                      >
                        Cancel
                      </button>
                    ) : selectedProposal.id === date.id &&
                      selectedProposal.type === "date" ? (
                      <button
                        type="button"
                        className={`rounded-lg px-2 py-1 ml-2 my-2 text-xs font-semibold shadow-sm text-white bg-red-800`}
                        onClick={() => {
                          setSelectedProposal({ id: null, type: null });
                          setChoices([0, 0, 0]);
                        }}
                      >
                        Close
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={`rounded-lg px-2 py-1 ml-2 my-2 text-xs font-semibold shadow-sm text-white bg-green-600`}
                        onClick={() => handleAcceptProposal(date.id, date.type)}
                      >
                        Date!
                      </button>
                    )}
                  </div>
                  {selectedProposal.id === date.id &&
                  selectedProposal.type === "date" ? (
                    <div className="flex flex-col items-center">
                      <div onClick={(e) => changeFroglin(e, date.offered_froglin_type)}>
                        {datingFroglin !== null ? (
                          <>
                            <img
                              className={`mb-2`}
                              src={`/images/froglin${datingFroglin}-large.webp`}
                              width="150px"
                              height="150px"
                              alt="froglin"
                            />
                            <span>{names[datingFroglin][0]}</span>
                          </>
                        ) : (
                          <>
                            <div
                              className={`w-[150px] h-[150px] mb-2 border-2 border-white flex items-center justify-center`}
                            >
                              Select Froglin
                            </div>
                            <span>???</span>
                          </>
                        )}
                      </div>
                      <div className="flex flex-row justify-between items-center gap-4 pb-4">
                        <div>
                          <span className="text-center">Round 1</span>
                          <SpinOptionBox
                            isSpinning={isSpinning}
                            box={1}
                            setChoices={setChoices}
                            currentOption={choices[0] ?? ""}
                          />
                        </div>
                        <div>
                          <span className="text-center">Round 2</span>
                          <SpinOptionBox
                            isSpinning={isSpinning}
                            box={2}
                            setChoices={setChoices}
                            currentOption={choices[1] ?? ""}
                          />
                        </div>
                        <div>
                          <span className="text-center">Round 3</span>
                          <SpinOptionBox
                            isSpinning={isSpinning}
                            box={3}
                            setChoices={setChoices}
                            currentOption={choices[2] ?? ""}
                          />
                        </div>
                      </div>
                      <FroglinMenuButton
                        disabled={datingFroglin === null}
                        text="Spin and go"
                        onClick={handleSpinAndGo}
                        className="p-2 bg-blue-500 text-white rounded"
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
