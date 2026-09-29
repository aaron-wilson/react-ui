"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../src/auth/AuthProvider";

export default function AuthCallbackPage() {
  const { completeCallback } = useAuth();
  const router = useRouter();
  const started = useRef(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const callback = window.location.href;
    window.history.replaceState(null, "", "/auth/callback/");
    void completeCallback(callback)
      .then(() => router.replace("/plan/"))
      .catch(() => setError(true));
  }, [completeCallback, router]);
  return (
    <main className="py-16" aria-live="polite">
      <h1 className="text-3xl font-semibold">{error ? "Sign-in failed" : "Completing sign-in…"}</h1>
      {error && (
        <>
          <p role="alert" className="mt-4">
            The sign-in request could not be completed. Start again from this site.
          </p>
          <Link className="primary mt-6 inline-flex" href="/">
            Back home
          </Link>
        </>
      )}
    </main>
  );
}
