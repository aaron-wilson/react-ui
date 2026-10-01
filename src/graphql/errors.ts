import type { CombinedError } from "urql";

const byCode: Record<string, string> = {
  UNAUTHENTICATED: "Your session has ended. Sign in again to continue.",
  FORBIDDEN: "You do not have access to this trip.",
  NOT_FOUND: "This trip no longer exists.",
  CONFLICT: "This trip changed somewhere else. The latest version is loaded; try again.",
  RATE_LIMITED: "Too much is in progress right now. Wait a moment, then try again.",
  BAD_USER_INPUT: "Some details were not accepted. Check them and try again.",
};

export function errorCode(error: CombinedError | undefined) {
  const code = error?.graphQLErrors[0]?.extensions?.code;
  return typeof code === "string" ? code : null;
}

/** Turns a transport or GraphQL failure into a sentence a traveller can act on. */
export function friendlyError(error: CombinedError | undefined, fallback: string) {
  if (!error) return fallback;
  if (error.networkError)
    return "The planning service cannot be reached. Check your connection and try again.";
  return byCode[errorCode(error) ?? ""] ?? fallback;
}
