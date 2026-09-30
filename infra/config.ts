import { z } from "zod";
const schema = z.object({
  PLATFORM_ACCOUNT: z.string().regex(/^\d{12}$/),
  PLATFORM_REGION: z.string().regex(/^[a-z]{2}-[a-z]+-\d$/),
  PLATFORM_ENV: z.string().regex(/^[a-z][a-z0-9-]{0,14}$/),
  PLATFORM_SITE_ORIGIN: z.url(),
  UI_CERTIFICATE_ARN: z.string().regex(/^arn:aws:acm:us-east-1:\d{12}:certificate\/[a-f0-9-]{36}$/),
});
export function parseConfig(input: Record<string, string | undefined>) {
  const result = schema.safeParse(input);
  if (!result.success)
    throw new Error(
      `Invalid UI deployment input: ${result.error.issues.map((issue) => issue.path.join(".")).join(", ")}`
    );
  const c = result.data;
  const origin = new URL(c.PLATFORM_SITE_ORIGIN);
  if (
    origin.protocol !== "https:" ||
    origin.origin !== c.PLATFORM_SITE_ORIGIN ||
    origin.port ||
    !origin.hostname.includes(".")
  )
    throw new Error("Invalid UI deployment input: PLATFORM_SITE_ORIGIN");
  if (!c.UI_CERTIFICATE_ARN.startsWith(`arn:aws:acm:us-east-1:${c.PLATFORM_ACCOUNT}:`))
    throw new Error("Invalid UI deployment input: UI_CERTIFICATE_ARN");
  return Object.freeze({ ...c, domainName: origin.hostname });
}
export type UiConfig = ReturnType<typeof parseConfig>;
