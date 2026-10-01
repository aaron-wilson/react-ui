import type { ReactNode } from "react";
import { Icon } from "../components/Icon";

interface Generation {
  status: "idle" | "running" | "completed" | "failed" | "cancelled" | "interrupted";
  text: string;
  error: string | null;
  reconnect: () => void;
}

/** Live progress for one generation: what is happening, the text so far, and how to recover. */
export function GenerationNotes({
  generation,
  idle,
  running,
  completed,
}: {
  generation: Generation;
  idle?: ReactNode;
  running: string;
  completed: string;
}) {
  const { status, text, error, reconnect } = generation;
  return (
    <div aria-live="polite" className="grid gap-3">
      {status === "idle" && idle}
      {status === "running" && (
        <p className="flex items-center gap-2 font-medium">
          <span className="spinner" aria-hidden="true" />
          {running}
        </p>
      )}
      {status === "completed" && (
        <p className="flex items-center gap-2 font-medium">
          <Icon name="check" />
          {completed}
        </p>
      )}
      {text && <p className="stream">{text}</p>}
      {status === "cancelled" && !error && <p className="muted">Planning was cancelled.</p>}
      {error && (
        <p role="alert" className="notice error text-sm">
          {error}
        </p>
      )}
      {status === "interrupted" && (
        <button className="control btn-sm justify-self-start" type="button" onClick={reconnect}>
          <Icon name="refresh" size={16} />
          Reconnect
        </button>
      )}
    </div>
  );
}
