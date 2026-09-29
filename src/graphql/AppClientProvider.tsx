"use client";

import type { ReactNode } from "react";
import { AuthProvider, useAuth } from "../auth/AuthProvider";
import { ScopedGraphProvider } from "./client";

function BoundGraph({ children }: { children: ReactNode }) {
  const { identity, getToken } = useAuth();
  return (
    <ScopedGraphProvider identity={identity} getToken={getToken}>
      {children}
    </ScopedGraphProvider>
  );
}

export function AppClientProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <BoundGraph>{children}</BoundGraph>
    </AuthProvider>
  );
}
