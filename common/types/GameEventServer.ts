import GameEventBase from "./GameEventBase";

type GameEventServer = GameEventBase & {
  start: () => void;
  advanceEpoch: () => void;
  revealInterestPoints: (interestPointIds: string[]) => void;
};

export default GameEventServer;
