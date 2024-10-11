import type { Dispatch, SetStateAction } from "react";

import type { AccountWithContracts } from "common/types";

type Player = {
  hasSecret: boolean;
  registered: boolean;
  username: string;
  traderId: bigint | null;
  setUsername: Dispatch<SetStateAction<string>>;
  setSecret: Dispatch<SetStateAction<string>>;
  aztec: AccountWithContracts | null;
};

export default Player;
