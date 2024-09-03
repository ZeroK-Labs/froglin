type GameEventServer = {
  start: () => void;
  stop: () => void;
  advanceEpoch: () => void;
};

export default GameEventServer;
