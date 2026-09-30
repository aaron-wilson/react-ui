import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

// The manifest fingerprints the inputs and committed bytes, not platform-specific
// encoder output. Changing the source or recipe requires deliberate regeneration.
export async function inspectImages(directory = root) {
  const source = await readFile(resolve(directory, "artwork/wander-city.svg"));
  const recipe = await readFile(resolve(directory, "scripts/build-images.mjs"));
  const { devDependencies } = JSON.parse(await readFile(resolve(directory, "package.json")));
  const dimensions = await sharp(source).metadata();
  const images = [];
  for (const width of [640, 1280]) {
    for (const format of ["webp", "avif"]) {
      const file = `public/images/wander-city-${width}.${format}`;
      const bytes = await readFile(resolve(directory, file));
      const metadata = await sharp(bytes).metadata();
      const height = Math.round((dimensions.height * width) / dimensions.width);
      const validFormat =
        format === "avif"
          ? metadata.format === "heif" && metadata.compression === "av1"
          : metadata.format === "webp";
      if (!validFormat || metadata.width !== width || metadata.height !== height)
        throw new Error(`Invalid image format or dimensions: ${file}`);
      // Decode the whole image as well as reading its header to reject truncated files.
      await sharp(bytes, { failOn: "warning" }).raw().toBuffer();
      images.push({ file, width, height, sha256: digest(bytes) });
    }
  }
  return {
    sourceSha256: digest(source),
    recipeSha256: digest(recipe),
    sharp: devDependencies.sharp,
    images,
  };
}

export async function checkImages(directory = root) {
  const saved = JSON.parse(await readFile(resolve(directory, "artwork/images.json")));
  const actual = await inspectImages(directory);
  if (JSON.stringify(saved) !== JSON.stringify(actual))
    throw new Error("Image source, recipe or artifact drift; regenerate with pnpm images:build");
}

async function buildImages() {
  const source = resolve(root, "artwork/wander-city.svg");
  for (const width of [640, 1280]) {
    for (const format of ["webp", "avif"]) {
      const path = resolve(root, `public/images/wander-city-${width}.${format}`);
      const bytes = await sharp(source)
        .resize({ width })
        .toFormat(format, { quality: 70 })
        .toBuffer();
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, bytes);
    }
  }
  await writeFile(
    resolve(root, "artwork/images.json"),
    JSON.stringify(await inspectImages(), null, 2) + "\n"
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && args[0] !== "--check"))
    throw new Error("Use --check to validate, or no arguments to regenerate");
  if (args[0] === "--check") {
    await checkImages();
    console.log("Checked 4 committed images, source and recipe");
  } else {
    await buildImages();
    console.log("Built 4 local images and their manifest");
  }
}
