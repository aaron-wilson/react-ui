import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, mkdir, copyFile, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkImages, inspectImages } from "../scripts/build-images.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const manifest = JSON.parse(await readFile(join(root, "artwork/images.json")));
const files = [
  "artwork/wander-city.svg",
  "artwork/images.json",
  "scripts/build-images.mjs",
  "package.json",
  ...manifest.images.map(({ file }) => file),
];

async function fixture(run) {
  const directory = await mkdtemp(join(tmpdir(), "wander-images-"));
  try {
    for (const file of files) {
      await mkdir(dirname(join(directory, file)), { recursive: true });
      await copyFile(join(root, file), join(directory, file));
    }
    await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test("validates committed assets without changing any file", async () => {
  await fixture(async (directory) => {
    const before = await Promise.all(files.map((file) => readFile(join(directory, file))));
    await checkImages(directory);
    const after = await Promise.all(files.map((file) => readFile(join(directory, file))));
    assert.deepEqual(after, before);
  });
});

for (const file of ["artwork/wander-city.svg", "scripts/build-images.mjs"]) {
  test(`rejects changed input: ${file}`, async () => {
    await fixture(async (directory) => {
      await writeFile(join(directory, file), (await readFile(join(directory, file))) + "\n");
      await assert.rejects(() => checkImages(directory), /drift/);
    });
  });
}

test("rejects corrupt images and wrong dimensions even before hash comparison", async () => {
  await fixture(async (directory) => {
    const target = join(directory, "public/images/wander-city-640.avif");
    await writeFile(target, "corrupt");
    await assert.rejects(() => inspectImages(directory));
    await copyFile(join(directory, "public/images/wander-city-1280.avif"), target);
    await assert.rejects(() => inspectImages(directory), /dimensions/);
    await copyFile(join(directory, "public/images/wander-city-640.webp"), target);
    await assert.rejects(() => inspectImages(directory), /format/);
  });
});

test("rejects an artifact fingerprint mismatch", async () => {
  await fixture(async (directory) => {
    const changed = structuredClone(manifest);
    changed.images[0].sha256 = "0".repeat(64);
    await writeFile(join(directory, "artwork/images.json"), JSON.stringify(changed));
    await assert.rejects(() => checkImages(directory), /drift/);
  });
});
