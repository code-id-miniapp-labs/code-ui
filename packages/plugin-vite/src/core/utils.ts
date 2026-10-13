import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";

export function resolveLibrarySourceDir(
  libraryName: string,
  root: string,
): string | null {
  try {
    const req = createRequire(path.join(root, "package.json"));
    const pkgJsonPath = req.resolve(`${libraryName}/package.json`);
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
    const miniprogramDir = pkgJson.miniprogram || "";
    return path.join(path.dirname(pkgJsonPath), miniprogramDir);
  } catch {
    return null;
  }
}

export function getDirSize(dir: string): number {
  let size = 0;
  if (!fs.existsSync(dir)) return size;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      size += getDirSize(fullPath);
    } else {
      size += stat.size;
    }
  }
  return size;
}

export function copyDirFresh(src: string, dest: string) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  // Wipe any stale/partial leftover at dest first so cpSync never has to
  // merge into (and potentially collide with) an existing directory.
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true });
}
