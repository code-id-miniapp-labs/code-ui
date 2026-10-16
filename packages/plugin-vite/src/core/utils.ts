import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";

export {
  compileComponentTheme,
  extractClassesFromThemeConfig,
  mergeComponentConfig,
} from "./theme";
export { mergeConfig } from "./config";
export { serializeFunction, serializeConfig } from "./serialize";
export { cleanKeyframes, cleanKeyframesInDir } from "./keyframes";

const librarySourceDirCache = new Map<string, string | null>();

export function resolveLibrarySourceDir(
  libraryName: string,
  root: string,
): string | null {
  const cacheKey = `${root}\0${libraryName}`;
  const cached = librarySourceDirCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const req = createRequire(path.join(root, "package.json"));
    const pkgJsonPath = req.resolve(`${libraryName}/package.json`);
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
    const miniprogramDir = pkgJson.miniprogram || "";
    const resolved = path.join(path.dirname(pkgJsonPath), miniprogramDir);
    librarySourceDirCache.set(cacheKey, resolved);
    return resolved;
  } catch {
    librarySourceDirCache.set(cacheKey, null);
    return null;
  }
}

export function getDirSize(dir: string): number {
  let size = 0;
  if (!fs.existsSync(dir)) return size;

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return size;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      size += getDirSize(fullPath);
    } else if (entry.isFile()) {
      try {
        size += fs.statSync(fullPath).size;
      } catch {
        // ignore
      }
    }
  }
  return size;
}

export function copyDirFresh(src: string, dest: string): void {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  // Wipe any stale/partial leftover at dest first so cpSync never has to
  // merge into (and potentially collide with) an existing directory.
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true });
}
