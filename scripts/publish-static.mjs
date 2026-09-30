import { spawnSync } from "node:child_process";
import { readFile, access } from "node:fs/promises";
import { resolve } from "node:path";
const execute = process.argv.includes("--execute");
if (process.argv.slice(2).some((arg) => !["--execute", "--dry-run"].includes(arg)))
  throw new Error("Use --dry-run (default) or --execute");
const {
  UI_BUCKET_NAME: bucket,
  UI_DISTRIBUTION_ID: distribution,
  UI_ASSET_REVISION: revision,
} = process.env;
if (!bucket || !/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket))
  throw new Error("Invalid UI_BUCKET_NAME");
if (!distribution || !/^[A-Z0-9]+$/.test(distribution))
  throw new Error("Invalid UI_DISTRIBUTION_ID");
if (!revision || !/^[a-f0-9]{40}$/.test(revision)) throw new Error("Invalid UI_ASSET_REVISION");
const root = resolve(process.env.STATIC_ARTIFACT_DIR ?? "out");
const manifest = JSON.parse(await readFile(resolve(root, "deployment.json"), "utf8"));
if (manifest.revision !== revision) throw new Error("Static artifact revision mismatch");
for (const file of ["index.html", "404.html", "auth/callback/index.html", "share/index.html"])
  await access(resolve(root, file));
const target = `s3://${bucket}/`;
const commands = [
  [
    "s3",
    "sync",
    `${root}/_next/static/`,
    `${target}_next/static/`,
    "--cache-control",
    "public,max-age=31536000,immutable",
  ],
  [
    "s3",
    "sync",
    root,
    target,
    "--exclude",
    "*.html",
    "--exclude",
    "_next/static/*",
    "--cache-control",
    "public,max-age=60",
  ],
  [
    "s3",
    "cp",
    root,
    target,
    "--recursive",
    "--exclude",
    "*",
    "--include",
    "*.html",
    "--cache-control",
    "public,max-age=60",
    "--content-type",
    "text/html",
  ],
  [
    "cloudfront",
    "create-invalidation",
    "--distribution-id",
    distribution,
    "--paths",
    "/",
    "/index.html",
    "/plan*",
    "/trip*",
    "/share*",
    "/docs*",
    "/auth/callback*",
    "/404.html",
    "/deployment.json",
  ],
];
for (const args of commands) {
  console.log(
    ["aws", ...args].map((value) => "'" + value.replaceAll("'", "'\"'\"'") + "'").join(" ")
  );
  if (execute) {
    const result = spawnSync("aws", args, { stdio: "inherit" });
    if (result.error)
      throw new Error("AWS CLI is required for explicit publication", { cause: result.error });
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
}
