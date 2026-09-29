"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { publicConfig, type PublicConfig } from "../config/public";
import { completeAuthorization, createAuthorizationRequest } from "./pkce";

interface Session {
  identity: string | null;
  token: string | null;
  expiresAt: number | null;
}
interface AuthValue {
  mode: "demo" | "live";
  identity: string | null;
  getToken: () => string | null;
  signIn: () => Promise<void>;
  signOut: () => void;
  completeCallback: (url: string) => Promise<void>;
}
const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({
  children,
  config = publicConfig,
}: {
  children: ReactNode;
  config?: PublicConfig;
}) {
  const [session, setSession] = useState<Session>(() =>
    config.mode === "demo"
      ? { identity: "demo", token: "demo", expiresAt: null }
      : { identity: null, token: null, expiresAt: null }
  );
  const signOut = useCallback(() => {
    setSession({ identity: null, token: null, expiresAt: null });
    sessionStorage.removeItem("wander-pkce");
  }, []);
  useEffect(() => {
    if (!session.expiresAt) return;
    const timer = setTimeout(signOut, Math.max(0, session.expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [session.expiresAt, signOut]);
  const getToken = useCallback(
    () => (session.expiresAt && session.expiresAt <= Date.now() ? null : session.token),
    [session.expiresAt, session.token]
  );
  const signIn = useCallback(async () => {
    if (config.mode === "demo") {
      setSession({ identity: "demo", token: "demo", expiresAt: null });
      return;
    }
    const url = await createAuthorizationRequest(config, window.location.origin, sessionStorage);
    window.location.assign(url);
  }, [config]);
  const completeCallback = useCallback(
    async (url: string) => {
      if (config.mode !== "live") throw new Error("Cognito callback is unavailable in demo mode");
      const next = await completeAuthorization(config, url, sessionStorage);
      setSession(next);
    },
    [config]
  );
  const value = useMemo<AuthValue>(
    () => ({
      mode: config.mode,
      identity: session.identity,
      getToken,
      signIn,
      signOut,
      completeCallback,
    }),
    [config.mode, session.identity, getToken, signIn, signOut, completeCallback]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("Authentication provider is missing");
  return value;
}
