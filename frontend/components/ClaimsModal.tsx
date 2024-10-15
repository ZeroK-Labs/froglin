import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import type { SwapOfferResponse, SwapOffer } from "frontend/types";
import { MODALS } from "frontend/enums";
import { Modal } from "frontend/components";
import { names } from "frontend/components/FroglinModal";
import { useModalState, usePlayer } from "frontend/stores";

export default function ClaimsModal() {
  const [claims, setClaims] = useState<SwapOffer[]>([]);
  const [refetch, setRefetch] = useState<boolean>(false);
  const { modal } = useModalState();
  const { aztec, registered, traderId } = usePlayer();

  const visible = modal === MODALS.CLAIMS;

  useEffect(
    () => {
      async function fetchClaims() {
        if (!aztec || !registered || !visible || !traderId) return;

        const claimsResponse: SwapOfferResponse[] =
          await aztec.contracts.gateway.methods
            .view_claimable_swaps(traderId)
            .simulate();

        if (!claimsResponse || claimsResponse.length === 0) return;

        const numberList: SwapOffer[] = [];

        for (let i = 0; i !== claimsResponse.length; ++i) {
          const claim = claimsResponse[i];
          if (claim.id === 101n) continue;

          numberList.push({
            trader_id: claim.trader_id,
            offered_froglin_type: Number(claim.offered_froglin_type),
            wanted_froglin_type: Number(claim.wanted_froglin_type),
            status: Number(claim.status),
            id: Number(claim.id),
          });
        }

        setClaims(numberList);
      }

      fetchClaims();
    }, //
    [aztec, registered, visible, refetch],
  );

  async function handleClaim(proposalId: number) {
    if (!aztec || !registered) return;

    const toastId = toast.loading("Claiming swap offer...");

    try {
      await aztec.contracts.gateway.methods
        .claim_swap_proposal(proposalId)
        .send()
        .wait();

      setRefetch(!refetch);
    } catch (error) {
      console.error("Error claiming swap:", error);
      toast.error("Failed to claim swap!", { id: toastId });
    }

    toast.success("Claimed!", { id: toastId });
  }

  return (
    <Modal
      className="top-4"
      title="Claims"
      visible={visible}
    >
      <div className="flex flex-col">
        {claims.map((claim) => (
          <div
            key={claim.id}
            className="w-[299px] h-[40px] flex items-center justify-between bg-gray-300 font-extrabold text-gray-900 rounded-md mb-2"
            onClick={() => handleClaim(claim.id)}
          >
            <div className="flex flex-row items-center gap-2">
              <img
                src={`/images/froglin${claim.wanted_froglin_type}.webp`}
                alt="Left Image"
                width="40px"
                height="40px"
                className="rounded-md"
              />
              <span className="text-sm no-text-shadow">
                {names[claim.wanted_froglin_type][0]}
              </span>
            </div>

            <span className="text-sm font-semibold no-text-shadow mr-4">
              Won in battle
            </span>
          </div>
        ))}
        <div className="w-[299px] h-[40px] flex items-center justify-between bg-gray-300 font-extrabold text-gray-900 rounded-md mb-2">
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
