import { ReactNode, createContext, useContext, useState } from "react";

import CircleIndicatorProps from "types/CircleIndicatorProps";

// default instance of type
const _default: CircleIndicatorProps = {
  color: "white",
  setColor: () => 0,
  opacity: 1,
  setOpacity: () => 0,
  size: 0,
  setSize: () => 0,
  visible: false,
  setVisible: () => 0,
} as const;

// context for the type
const CircleIndicatorPropsContext =
  createContext<CircleIndicatorProps>(_default);

function createState() {
  const [color, setColor] = useState(_default.color);
  const [opacity, setOpacity] = useState(_default.opacity);
  const [size, setSize] = useState(_default.size);
  const [visible, setVisible] = useState(_default.visible);

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

type ProviderProps = {
  children: ReactNode;
};

// provider component for the context
function CircleIndicatorPropsProvider(props: ProviderProps) {
  return (
    <CircleIndicatorPropsContext.Provider value={createState()}>
      {props.children}
    </CircleIndicatorPropsContext.Provider>
  );
}

function useCircleIndicatorProps() {
  return useContext(CircleIndicatorPropsContext);
}

export { useCircleIndicatorProps, CircleIndicatorPropsProvider };
