"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useClient } from "urql";
import type { CreateTripInput, RefineTripInput } from "../gql/graphql";
import { StartCreate, StartRefine } from "../graphql/operations";
import { publicConfig } from "../config/public";
import { consumeGeneration, type GenerationEvent } from "./stream";

type State = {
  id: string | null;
  seq: number;
  status: "idle" | "running" | "completed" | "failed" | "cancelled" | "interrupted";
  text: string;
  tripId: string | null;
  error: string | null;
};
const empty: State = { id: null, seq: 0, status: "idle", text: "", tripId: null, error: null };

export function useGeneration(getToken: () => string | null) {
  const client = useClient();
  const [state, setState] = useState<State>(empty);
  const active = useRef<string | null>(null);
  const lastSeq = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const connect = useCallback(
    (id: string, after: number) => {
      controller.current?.abort();
      const next = new AbortController();
      controller.current = next;
      const token = getToken();
      if (!token) {
        setState((current) => ({ ...current, status: "failed", error: "Sign in to continue." }));
        return;
      }
      void consumeGeneration(
        publicConfig.graphqlUrl,
        id,
        token,
        after,
        next.signal,
        (event: GenerationEvent) => {
          if (active.current !== event.id) return;
          if (event.type !== "snapshot" && event.seq <= lastSeq.current) return;
          lastSeq.current = event.seq;
          setState((current) => ({
            ...current,
            seq: event.seq,
            status: event.status,
            text:
              event.type === "chunk"
                ? current.text + (event.text ?? "")
                : event.type === "snapshot"
                  ? (event.text ?? current.text)
                  : current.text,
            tripId: event.tripId ?? current.tripId,
            error:
              event.status === "failed"
                ? "Planning could not finish. Try again."
                : event.status === "interrupted"
                  ? "This plan was interrupted. Start again."
                  : null,
          }));
        }
      ).catch(() => {
        if (!next.signal.aborted && active.current === id)
          setState((current) => ({
            ...current,
            status: "interrupted",
            error: "Connection lost. Reconnect to continue.",
          }));
      });
    },
    [getToken]
  );
  const begin = useCallback(
    (id: string) => {
      active.current = id;
      lastSeq.current = 0;
      setState({ ...empty, id, status: "running" });
      connect(id, 0);
    },
    [connect]
  );
  const startCreate = useCallback(
    async (input: CreateTripInput) => {
      const result = await client.mutation(StartCreate, { input }).toPromise();
      const id = result.data?.startCreateGeneration.id;
      if (!id) {
        setState({
          ...empty,
          status: "failed",
          error: result.error?.message ?? "Could not start planning.",
        });
        return;
      }
      begin(id);
    },
    [begin, client]
  );
  const startRefine = useCallback(
    async (input: RefineTripInput) => {
      const result = await client.mutation(StartRefine, { input }).toPromise();
      const id = result.data?.startRefineGeneration.id;
      if (!id) {
        setState({
          ...empty,
          status: "failed",
          error: result.error?.message ?? "Could not start refinement.",
        });
        return;
      }
      begin(id);
    },
    [begin, client]
  );
  const reconnect = useCallback(() => {
    if (state.id) connect(state.id, lastSeq.current);
  }, [connect, state.id]);
  useEffect(() => () => controller.current?.abort(), []);
  return { ...state, startCreate, startRefine, reconnect };
}
