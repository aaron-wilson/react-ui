import { expect, it } from "vitest";
import { CombinedError } from "urql";
import { GraphQLError } from "graphql";
import { errorCode, friendlyError } from "../src/graphql/errors";
import { dayCount, formatDay, formatRange, formatUpdated, paceLabel } from "../src/lib/format";

it("formats calendar dates without shifting the day", () => {
  expect(formatDay("2026-10-15")).toBe("Thursday, October 15");
  expect(formatDay("not-a-date")).toBe("not-a-date");
  expect(formatRange(["2026-10-15"])).toBe("Oct 15, 2026");
  expect(formatRange(["2026-10-15", "2026-10-16", "2026-10-17"])).toBe("Oct 15 – 17, 2026");
  expect(formatRange(["2026-10-30", "2026-11-02"])).toBe("Oct 30 – Nov 2, 2026");
  expect(formatRange(["2026-12-30", "2027-01-02"])).toBe("Dec 30, 2026 – Jan 2, 2027");
  expect(formatRange([])).toBeNull();
  expect(dayCount(1)).toBe("1 day");
  expect(dayCount(3)).toBe("3 days");
  expect(paceLabel("BUSY")).toBe("Busy");
});

it("describes recent saves relatively", () => {
  const now = Date.parse("2026-10-01T12:00:00Z");
  expect(formatUpdated("2026-10-01T11:59:40Z", now)).toBe("just now");
  expect(formatUpdated("2026-10-01T11:15:00Z", now)).toBe("45 min ago");
  expect(formatUpdated("2026-10-01T07:00:00Z", now)).toBe("5 h ago");
  expect(formatUpdated("2026-09-20T07:00:00Z", now)).toMatch(/^Sep \d+$/);
  expect(formatUpdated("nonsense", now)).toBeNull();
});

it("maps service failures to sentences without echoing internals", () => {
  const coded = (code: string) =>
    new CombinedError({
      graphQLErrors: [new GraphQLError("Trip version conflict", { extensions: { code } })],
    });
  expect(errorCode(coded("CONFLICT"))).toBe("CONFLICT");
  expect(friendlyError(coded("CONFLICT"), "fallback")).toContain("changed somewhere else");
  expect(friendlyError(coded("INTERNAL_SERVER_ERROR"), "fallback")).toBe("fallback");
  expect(friendlyError(new CombinedError({ networkError: new Error("ECONNREFUSED") }), "x")).toBe(
    "The planning service cannot be reached. Check your connection and try again."
  );
  expect(friendlyError(undefined, "fallback")).toBe("fallback");
});
