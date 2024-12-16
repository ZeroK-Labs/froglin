export type Proposal = {
  trader_id: bigint;
  offered_froglin_type: number;
  wanted_froglin_type: number;
  status: number;
  id: number;
  type: "swap" | "battle" | "date";
};
export type DateProposal = Omit<Proposal, "wanted_froglin_type">;
