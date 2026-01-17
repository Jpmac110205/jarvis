import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type GoogleConnectionContextType = {
  connectedToGoogle: boolean | null;
  setConnectedToGoogle: (value: boolean | null) => void;
};

const GoogleConnectionContext = createContext<GoogleConnectionContextType | undefined>(
  undefined
);

export function GoogleConnectionProvider({ children }: { children: ReactNode }) {
  const [connectedToGoogle, setConnectedToGoogle] = useState<boolean | null>(null);

  return (
    <GoogleConnectionContext.Provider
      value={{ connectedToGoogle, setConnectedToGoogle }}
    >
      {children}
    </GoogleConnectionContext.Provider>
  );
}

export function useGoogleConnection() {
  const context = useContext(GoogleConnectionContext);
  if (!context) {
    throw new Error(
      "useGoogleConnection must be used within a GoogleConnectionProvider"
    );
  }
  return context;
}
