"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";

const ApiConfigContext = createContext({ isConfigured: false });
export const useApiConfig = () => useContext(ApiConfigContext);

export function ApiConfigProvider({
  children,
  isConfigured,
}: {
  children: ReactNode;
  isConfigured: boolean;
}) {
  useEffect(() => {
    // Remove credentials persisted by older versions of this demo; never read them.
    try {
      localStorage.removeItem("apiConfig");
    } catch {
      /* Storage can be disabled. */
    }
  }, []);
  return (
    <ApiConfigContext.Provider value={{ isConfigured }}>
      {children}
    </ApiConfigContext.Provider>
  );
}
