import { readdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

for (const key of ["SENTRY_AUTH_TOKEN", "SENTRY_ORG", "SENTRY_PROJECT", "SENTRY_RELEASE"]) {
  if (!process.env[key]) throw new Error(`Missing ${key}`);
}
const chunks = resolve("out/_next/static/chunks");
const files = (await readdir(chunks, { recursive: true })).filter((name) =>
  name.endsWith(".js.map")
);
if (!files.length) throw new Error("No browser source maps; build with SENTRY_SOURCE_MAPS=true");
const cli = resolve("node_modules/.bin/sentry-cli");
const result = spawnSync(
  cli,
  [
    "sourcemaps",
    "upload",
    "--org",
    process.env.SENTRY_ORG,
    "--project",
    process.env.SENTRY_PROJECT,
    "--release",
    process.env.SENTRY_RELEASE,
    "--url-prefix",
    "~/_next/static/chunks",
    chunks,
  ],
  { stdio: "inherit", env: process.env }
);
if (result.status !== 0) throw new Error(`Sentry upload failed with exit ${result.status}`);
for (const name of files) await rm(resolve(chunks, name));
console.log(`Uploaded and removed ${files.length} source maps from out/`);
