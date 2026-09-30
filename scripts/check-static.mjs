import assert from "node:assert/strict";
import { createServer } from "node:net";
import { spawn } from "node:child_process";
const probe = createServer();
await new Promise((resolve) => probe.listen(0, "127.0.0.1", resolve));
const port = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
const server = spawn("node", ["scripts/serve-static.mjs"], {
  env: { ...process.env, PORT: String(port), HOST: "127.0.0.1" },
  stdio: "inherit",
});
try {
  const origin = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      if ((await fetch(origin, { signal: AbortSignal.timeout(1000) })).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(ready, "Static server did not start");
  for (const path of [
    "/",
    "/plan/",
    "/trip/",
    "/docs/",
    "/auth/callback/?code=fixture&state=fixture",
    "/share/?id=fixture&token=fixture",
  ]) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get("content-type"), /text\/html/);
    assert.match(await response.text(), /<html/);
  }
  for (const path of ["/images/wander-city-640.avif", "/images/wander-city-1280.webp"]) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 200, path);
    assert.ok((await response.arrayBuffer()).byteLength > 0);
  }
  for (const path of ["/missing/", "/images/missing.webp"])
    assert.equal((await fetch(origin + path)).status, 404, path);
  console.log("Static direct routes, docs, callback/share queries and missing assets passed");
} finally {
  server.kill();
  await new Promise((resolve) => server.once("exit", resolve));
}
