export function parseBuildConfig(input: { UI_SITE_ORIGIN?: string }) {
  const url = new URL(input.UI_SITE_ORIGIN || "http://localhost:3001");
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.origin !== url.toString().replace(/\/$/, "")
  )
    throw new Error("Invalid UI_SITE_ORIGIN");
  return Object.freeze({ siteOrigin: url.origin });
}

export const buildConfig = parseBuildConfig({ UI_SITE_ORIGIN: process.env.UI_SITE_ORIGIN });
