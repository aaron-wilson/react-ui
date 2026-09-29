"use client";

import { useMemo, type ReactNode } from "react";
import { Provider, cacheExchange, createClient, fetchExchange } from "urql";
import { publicConfig } from "../config/public";

export function createScopedClient(
  url: string,
  getToken: () => string | null,
  transport?: typeof fetch
) {
  return createClient({
    url,
    fetch: transport,
    exchanges: [cacheExchange, fetchExchange],
    fetchOptions: () => {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      return { headers };
    },
  });
}

/** Replaces the entire document cache whenever the authenticated identity changes. */
export function ScopedGraphProvider({
  identity,
  getToken,
  children,
}: {
  identity: string | null;
  getToken: () => string | null;
  children: ReactNode;
}) {
  const client = useMemo(() => {
    void identity;
    return createScopedClient(publicConfig.graphqlUrl, getToken);
  }, [identity, getToken]);
  return <Provider value={client}>{children}</Provider>;
}
