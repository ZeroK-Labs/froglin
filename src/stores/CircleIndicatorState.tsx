import { useState } from "react";

import { StoreFactory } from "stores";
import { CircleIndicatorState } from "types";

function createState(): CircleIndicatorState {
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
  Provider: CircleIndicatorStateProvider,
  useProvider: useCircleIndicatorState,
} = StoreFactory<CircleIndicatorState>(createState);
