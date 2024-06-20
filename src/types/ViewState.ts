import { MAP_VIEWS } from "enums";

type ViewState = {
  view: MAP_VIEWS;
  setView: React.Dispatch<React.SetStateAction<MAP_VIEWS>>;
};

export default ViewState;
