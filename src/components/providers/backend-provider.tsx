"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";
import { createContext, useContext, useState, type ReactNode } from "react";

type BackendContextValue = {
  configured: boolean;
};

const BackendContext = createContext<BackendContextValue>({
  configured: false,
});

export function BackendProvider({ children }: { children: ReactNode }) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const [client] = useState(() =>
    convexUrl ? new ConvexReactClient(convexUrl) : null,
  );

  if (!client) {
    return (
      <BackendContext.Provider value={{ configured: false }}>
        {children}
      </BackendContext.Provider>
    );
  }

  return (
    <BackendContext.Provider value={{ configured: true }}>
      <ConvexAuthNextjsProvider client={client}>
        {children}
      </ConvexAuthNextjsProvider>
    </BackendContext.Provider>
  );
}

export function useBackend() {
  return useContext(BackendContext);
}
