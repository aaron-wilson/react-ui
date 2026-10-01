"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";

export function AuthControls() {
  const { mode, identity, signIn, signOut } = useAuth();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-2">
      {identity && (
        <span className="chip chip-quiet hidden sm:inline-flex">
          {mode === "demo" ? "Demo mode" : "Signed in"}
        </span>
      )}
      {identity ? (
        <button className="control btn-sm" type="button" onClick={signOut}>
          Sign out
        </button>
      ) : (
        <button
          className="control btn-sm"
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
