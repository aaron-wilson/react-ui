"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";

export function AuthControls() {
  const { mode, identity, signIn, signOut } = useAuth();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-3">
      {identity && (
        <span className="hidden text-sm opacity-75 sm:inline">
          {mode === "demo" ? "Demo mode" : "Signed in"}
        </span>
      )}
      {identity ? (
        <button className="control" type="button" onClick={signOut}>
          Sign out
        </button>
      ) : (
        <button
          className="control"
          type="button"
          onClick={() => void signIn().catch(() => setError("Could not start sign-in."))}
        >
          {mode === "demo" ? "Continue demo" : "Sign in"}
        </button>
      )}
      {error && (
        <span role="alert" className="error text-sm">
          {error}
        </span>
      )}
    </div>
  );
}
