import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import type { SwapOfferResponse } from "frontend/types";
import type { Proposal } from "frontend/types/Proposals";
import { MODALS } from "frontend/enums";
import { Modal } from "frontend/components";
import { names } from "frontend/components/FroglinModal";
import { useModalState, usePlayer } from "frontend/stores";

type BattleResponse = {
  froglin_won: bigint;
  froglin_to_recover: bigint;
};

export default function ClaimsModal() {
  const [claims, setClaims] = useState<Proposal[]>([]);
  const [wins, setWins] = useState<Record<string, number>[]>([]);
  const [refetch, setRefetch] = useState<boolean>(false);
  const { modal } = useModalState();
  const { aztec, registered, traderId } = usePlayer();

  const visible = modal === MODALS.CLAIMS;

  useEffect(
    () => {
      async function fetchClaims() {
        if (!aztec || !registered || !visible || !traderId) return;
        let claimsResponse: SwapOfferResponse[] = [];
        try {
          claimsResponse = await aztec.contracts.gateway.methods
            .view_claimable_swaps(traderId)
            .simulate();
        } catch (error) {
          console.error("Error fetching claims:", error);
        }

        if (!claimsResponse || claimsResponse.length === 0) return;
        const numberList: Proposal[] = [];

        for (let i = 0; i !== claimsResponse.length; ++i) {
          const claim = claimsResponse[i];
          if (claim.id === 101n) continue;

          numberList.push({
            trader_id: claim.trader_id,
            offered_froglin_type: Number(claim.offered_froglin_type),
            wanted_froglin_type: Number(claim.wanted_froglin_type),
            status: Number(claim.status),
            id: Number(claim.id),
            type: "swap",
          });
        }

        setClaims(numberList);
      }

      async function fetchWinnings() {
        if (!aztec || !registered || !visible || !traderId) return;
        let winsInBattleResponse: BattleResponse[] = [];
        try {
          winsInBattleResponse = await aztec.contracts.gateway.methods
            .view_won_in_battle(aztec.wallet.getAddress())
            .simulate();
        } catch (error) {
          console.error("Error fetching winnings:", error);
        }
        console.log(winsInBattleResponse);
        if (!winsInBattleResponse || winsInBattleResponse.length === 0) return;

        const winsInBattle: Record<string, number>[] = [];
        for (let i = 0; i !== winsInBattleResponse.length; ++i) {
          const win = winsInBattleResponse[i];
          if (win.froglin_won === 101n && win.froglin_to_recover === 101n) continue;

          winsInBattle.push({
            froglin_won: Number(win.froglin_won),
            froglin_to_recover: Number(win.froglin_to_recover),
          });
        }
        setWins(winsInBattle);
      }

      fetchClaims();
      fetchWinnings();
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

  async function handleClaimWin(win: number) {
    if (!aztec || !registered) return;

    const toastId = toast.loading("Claiming win...");

    try {
      await aztec.contracts.gateway.methods.claim_winnings(win).send().wait();

      setRefetch(!refetch);
    } catch (error) {
      console.error("Error claiming win:", error);
      toast.error("Failed to claim win!", { id: toastId });
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
        {claims.length > 0
          ? claims.map((claim) => (
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
                  Swaped
                </span>
              </div>
            ))
          : null}
        {wins.length > 0
          ? wins.map((win, index) => (
              <div
                key={index}
                className="w-[299px] h-[40px] flex items-center justify-between bg-gray-300 font-extrabold text-gray-900 rounded-md mb-2"
                onClick={() => handleClaimWin(win.froglin_won)}
              >
                <div className="flex flex-row items-center gap-2">
                  {win.froglin_to_recover !== 101 ? (
                    <img
                      src={`/images/froglin${win.froglin_to_recover}.webp`}
                      alt="Left Image"
                      width="35px"
                      height="35px"
                      className="rounded-md"
                    />
                  ) : null}
                  <img
                    src={`/images/froglin${win.froglin_won}.webp`}
                    alt="Left Image"
                    width="40px"
                    height="40px"
                    className="rounded-md"
                  />
                  <span className="text-sm no-text-shadow">
                    {names[win.froglin_won][0]}
                  </span>
                </div>

                <span className="text-sm font-semibold no-text-shadow mr-4">
                  Won in battle
                </span>
              </div>
            ))
          : null}
      </div>
    </Modal>
  );
}
