import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "artwork/wander-city.svg");
const check = process.argv.includes("--check");
const outputs = [];
for (const width of [640, 1280]) {
  for (const format of ["webp", "avif"]) {
    const path = resolve(root, `public/images/wander-city-${width}.${format}`);
    const bytes = await sharp(source)
      .resize({ width })
      .toFormat(format, { quality: 70 })
      .toBuffer();
    if (check) {
      const saved = await readFile(path);
      if (!saved.equals(bytes)) throw new Error(`Image drift: ${path}`);
    } else {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, bytes);
    }
    outputs.push(path);
  }
}
console.log(`${check ? "Checked" : "Built"} ${outputs.length} local images`);
