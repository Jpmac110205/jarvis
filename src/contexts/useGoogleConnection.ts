import { createContext, useContext } from "react";
type GoogleConnectionContextType = {
  connectedToGoogle: boolean | null;
  setConnectedToGoogle: (value: boolean | null) => void;
};

export const GoogleConnectionContext = createContext<
  GoogleConnectionContextType | undefined
>(undefined);

export function useGoogleConnection() {
  const context = useContext(GoogleConnectionContext);
  if (!context) {
    throw new Error(
      "useGoogleConnection must be used within a GoogleConnectionProvider",
    );
  }
  return context;
}
