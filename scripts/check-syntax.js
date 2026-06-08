import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const skip = new Set(["node_modules", ".git"]);
const files = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
    } else if (entry.name.endsWith(".js")) {
      files.push(path);
    }
  }
}

await walk(root);

for (const file of files) {
  const source = await readFile(file, "utf8");
  const mergeMarker = "<".repeat(7);
  if (source.includes(mergeMarker)) {
    throw new Error(`Merge marker found in ${file}`);
  }
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) {
    console.error(result.stderr);
    process.exit(result.status);
  }
}

console.log(`Checked ${files.length} JavaScript files.`);
