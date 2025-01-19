import type { Dispatch, SetStateAction } from "react";

import type { AccountWithContracts, WorldEvent } from "common/types";

type Player = {
  hasSecret: boolean;
  registered: boolean;
  username: string;
  traderId: bigint | null;
  setUsername: Dispatch<SetStateAction<string>>;
  setSecret: Dispatch<SetStateAction<string>>;
  aztec: AccountWithContracts | null;

  stash: number[];
  fetchStash: () => void;

  events: WorldEvent[];
  joinEvent: (ev: WorldEvent) => void;
  leaveEvent: (ev: WorldEvent) => void;
};

export default Player;
