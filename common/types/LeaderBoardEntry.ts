import { type AztecAddress } from "@aztec/aztec.js";

type LeaderBoardEntry = {
  player: AztecAddress;
  score: number;
};

export default LeaderBoardEntry;
