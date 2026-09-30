"use client";

import type { ReactNode } from "react";
import * as Sentry from "@sentry/react";
import { publicConfig } from "../config/public";
import { initMonitoring } from "./sentry";

if (typeof window !== "undefined")
  initMonitoring(publicConfig.sentryDsn, publicConfig.sentryRelease);

export function MonitoringBoundary({ children }: { children: ReactNode }) {
  if (!publicConfig.sentryDsn) return <>{children}</>;
  return (
    <Sentry.ErrorBoundary fallback={<p role="alert">Something went wrong. Reload to try again.</p>}>
      {children}
    </Sentry.ErrorBoundary>
  );
}
