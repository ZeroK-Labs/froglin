import { FunctionComponent, ReactNode, createContext, useContext } from "react";

type ProviderProps = {
  children: ReactNode;
};

export default function StoreFactory<T>(createState: () => T) {
  const Context = createContext<T | undefined>(undefined);

  const Provider: FunctionComponent<ProviderProps> = ({ children }) => {
    const state = createState();
    return <Context.Provider value={state}>{children}</Context.Provider>;
  };

  function useProvider() {
    const context = useContext(Context);

    // TODO: perform this check only in dev mode
    if (context === undefined) {
      throw new Error("useProvider must be used within a Provider");
    }
    return context;
  }

  return { Provider, useProvider };
}
