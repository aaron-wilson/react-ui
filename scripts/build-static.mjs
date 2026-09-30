import { spawnSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { parsePublicConfig } from "../src/config/public.ts";
const revision = process.env.UI_ASSET_REVISION;
if (!revision || !/^[a-f0-9]{40}$/.test(revision)) throw new Error("Invalid UI_ASSET_REVISION");
const config = parsePublicConfig(process.env);
if (config.mode === "live" && new URL(config.graphqlUrl).protocol !== "https:")
  throw new Error("Live GraphQL URL must use HTTPS");
const result = spawnSync("node_modules/.bin/next", ["build", "--webpack"], {
  stdio: "inherit",
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
await writeFile("out/deployment.json", JSON.stringify({ revision, publicConfig: config }) + "\n");
