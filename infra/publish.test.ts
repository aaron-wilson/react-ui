import { expect, it } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
it("publishes hashes before HTML, retains old assets and defaults to dry-run", () => {
  const root = mkdtempSync(join(tmpdir(), "wander-static-"));
  const revision = "1111111111111111111111111111111111111111";
  try {
    for (const dir of ["auth/callback", "share", "_next/static"])
      mkdirSync(join(root, dir), { recursive: true });
    for (const file of ["index.html", "404.html", "auth/callback/index.html", "share/index.html"])
      writeFileSync(join(root, file), "<html></html>");
    writeFileSync(join(root, "deployment.json"), JSON.stringify({ revision }));
    const run = (rev = revision) =>
      spawnSync("node", ["scripts/publish-static.mjs"], {
        encoding: "utf8",
        env: {
          ...process.env,
          STATIC_ARTIFACT_DIR: root,
          UI_BUCKET_NAME: "example-bucket",
          UI_DISTRIBUTION_ID: "EXAMPLE123",
          UI_ASSET_REVISION: rev,
        },
      });
    const result = run();
    expect(result.status).toBe(0);
    const commands = result.stdout.trim().split("\n");
    expect(commands).toHaveLength(4);
    expect(commands[0]).toContain("immutable");
    expect(commands[2]).toContain("text/html");
    expect(commands[3]).toContain("create-invalidation");
    expect(result.stdout).not.toContain("--delete");
    expect(run("2222222222222222222222222222222222222222").status).not.toBe(0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
