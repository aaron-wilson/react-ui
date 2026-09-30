import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const hub = resolve(root, "../graph-rest-react-stack");
const entries = ["planning-journey", "planning-providers"];
const check = process.argv.includes("--check");
const snapshot = [];
let siblingAvailable = true;

for (const name of entries) {
  const target = resolve(root, `content/${name}.mdx`);
  let source;
  try {
    source = await readFile(resolve(hub, `docs/patterns/${name}.md`), "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    siblingAvailable = false;
    source = await readFile(target, "utf8");
  }
  if (check) {
    if ((await readFile(target, "utf8")) !== source)
      throw new Error(`Documentation drift: ${name}`);
  } else {
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, source);
  }
  snapshot.push({ name, sha256: createHash("sha256").update(source).digest("hex") });
}

const manifestPath = resolve(root, "content/snapshot.json");
let revision = "standalone-snapshot";
if (siblingAvailable) {
  revision = execFileSync(
    "git",
    ["log", "-1", "--format=%H", "--", ...entries.map((name) => `docs/patterns/${name}.md`)],
    { cwd: hub, encoding: "utf8" }
  ).trim();
}
const manifest = JSON.stringify({ sourceRevision: revision, documents: snapshot }, null, 2) + "\n";
if (check) {
  const existing = JSON.parse(await readFile(manifestPath, "utf8"));
  if (JSON.stringify(existing.documents) !== JSON.stringify(snapshot)) {
    throw new Error("Documentation snapshot hash drift");
  }
  if (siblingAvailable && existing.sourceRevision !== revision) {
    throw new Error("Documentation source revision drift; run docs:sync");
  }
} else {
  await writeFile(manifestPath, manifest);
}
