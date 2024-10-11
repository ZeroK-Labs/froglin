import { useState, useEffect } from "react";
import { MODALS } from "frontend/enums";
import { Modal } from "frontend/components";
import { useModalState, usePlayer } from "frontend/stores";
import { names } from "frontend/components/FroglinModal";
import { Offer } from "./NoticeBoardModal";

export default function ClaimsModal() {
  const [claims, setClaims] = useState<Offer[]>([]);
  const { modal } = useModalState();
  const { aztec, registered, traderId } = usePlayer();

  const visible = modal === MODALS.CLAIMS;
  console.log("claims", claims);
  useEffect(
    () => {
      async function fetchClaims() {
        if (!aztec || !registered || !visible || !traderId) return;

        const claimsResponse = await aztec.contracts.gateway.methods
          .view_all_proposals()
          .simulate();

        console.log("claims", claimsResponse);
        const res = await aztec.contracts.gateway.methods
          .view_claimable_swaps(traderId)
          .simulate();
        console.log("res", res);
        if (!claimsResponse || claimsResponse.length === 0) return;

        const numberList: Offer[] = [];

        claimsResponse.forEach(
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
                trader_id: trader_id,
                offered_froglin_type: Number(offered_froglin_type),
                wanted_froglin_type: Number(wanted_froglin_type),
                status: Number(status),
                id: Number(id),
              });
            }
          },
        );
        setClaims(numberList);
      }

      fetchClaims();
    }, //
    [aztec, registered, visible],
  );

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
