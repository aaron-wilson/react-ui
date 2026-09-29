"use client";

import type { ReactNode } from "react";
import { demoIdentity, demoToken } from "../auth/demo";
import { ScopedGraphProvider } from "./client";

export function AppClientProvider({ children }: { children: ReactNode }) {
  return (
    <ScopedGraphProvider identity={demoIdentity} getToken={demoToken}>
      {children}
    </ScopedGraphProvider>
  );
}
