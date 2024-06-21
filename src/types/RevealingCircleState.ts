type RevealingCircleState = {
  color: string;
  setColor: React.Dispatch<React.SetStateAction<string>>;

  opacity: number;
  setOpacity: React.Dispatch<React.SetStateAction<number>>;

  size: number;
  setSize: React.Dispatch<React.SetStateAction<number>>;

  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
};

export default RevealingCircleState;
