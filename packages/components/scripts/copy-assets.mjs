import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, "../src");
const distDir = path.resolve(__dirname, "../dist");

function copyDirRecursive(source, target) {
  if (!fs.existsSync(source)) return;
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const entries = fs.readdirSync(source, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else if (
      entry.name.endsWith(".wxml") ||
      entry.name.endsWith(".wxss") ||
      entry.name.endsWith(".json")
    ) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Ensure .d.ts files exist alongside .d.cts
function duplicateDts(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      duplicateDts(fullPath);
    } else if (entry.name.endsWith(".d.cts")) {
      const dtsPath = path.join(dir, entry.name.replace(".d.cts", ".d.ts"));
      fs.copyFileSync(fullPath, dtsPath);
    }
  }
}

copyDirRecursive(srcDir, distDir);
duplicateDts(distDir);
console.log("✔ Copied WXML, WXSS, JSON assets and generated .d.ts files in dist/");
