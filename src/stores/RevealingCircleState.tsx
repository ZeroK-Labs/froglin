import { useState } from "react";

import { StoreFactory } from "src/stores";
import { RevealingCircleState } from "src/types";

function createState(): RevealingCircleState {
  const [color, setColor] = useState("white");
  const [opacity, setOpacity] = useState(1);
  const [size, setSize] = useState(0);
  const [visible, setVisible] = useState(false);

  return {
    visible,
    setVisible,
    color,
    setColor,
    size,
    setSize,
    opacity,
    setOpacity,
  };
}

export const {
  Provider: RevealingCircleStateProvider,
  useProvider: useRevealingCircleState,
} = StoreFactory<RevealingCircleState>(createState);
