import { useState } from "react";
import type { ReactNode } from "react";
import { GoogleConnectionContext } from "./useGoogleConnection";

export function GoogleConnectionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [connectedToGoogle, setConnectedToGoogle] = useState<boolean | null>(
    null,
  );

  return (
    <GoogleConnectionContext.Provider
      value={{ connectedToGoogle, setConnectedToGoogle }}
    >
      {children}
    </GoogleConnectionContext.Provider>
  );
}
