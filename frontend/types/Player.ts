import { Dispatch } from "react";

import { AccountWithContracts } from "common/types";

type Player = {
  hasSecret: boolean;
  username: string;
  setUsername: Dispatch<React.SetStateAction<string>>;
  setSecret: Dispatch<React.SetStateAction<string>>;
  aztec: AccountWithContracts | null;
};

export default Player;
