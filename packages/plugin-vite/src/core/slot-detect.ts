import fs from "node:fs";
import path from "node:path";
import {
  transformWxmlSlots,
  type TransformWxmlSlotsOptions,
} from "@code-id-labs/compiler";
import {
  isBundleAsset,
  type OutputBundleLike,
  type ResolvedSlotDetectOptions,
} from "../types";

function toCompilerOptions(
  opts: ResolvedSlotDetectOptions,
): TransformWxmlSlotsOptions {
  const compilerOpts: TransformWxmlSlotsOptions = {
    prefix: opts.prefix,
  };
  if (opts.componentSlots !== undefined) {
    compilerOpts.componentSlots = opts.componentSlots;
  }
  return compilerOpts;
}

/**
 * Transforms a `.wxml` module or raw template string with compile-time active slot detection.
 * Handles both raw WXML strings and `export default "..."` JS wrappers.
 */
export function applySlotDetectToCode(
  code: string,
  opts: ResolvedSlotDetectOptions,
): { code: string; hasChanges: boolean } {
  if (!opts.enable) return { code, hasChanges: false };
  const compilerOpts = toCompilerOptions(opts);

  const exportDefaultMatch = code.match(
    /^(\s*export\s+default\s+)(["'`][\s\S]*["'`])(\s*;?\s*)$/,
  );
  if (exportDefaultMatch && exportDefaultMatch[2]) {
    try {
      const parsed: unknown = JSON.parse(exportDefaultMatch[2]);
      if (typeof parsed === "string") {
        const res = transformWxmlSlots(parsed, compilerOpts);
        if (!res.hasChanges) return { code, hasChanges: false };
        return {
          code: `${exportDefaultMatch[1]}${JSON.stringify(res.code)}${exportDefaultMatch[3] ?? ""}`,
          hasChanges: true,
        };
      }
    } catch {
      // Fallback to raw transform if not valid JSON string literal
    }
  }

  return transformWxmlSlots(code, compilerOpts);
}

/**
 * Applies compile-time slot detection to `.wxml` assets in Rollup/Vite `generateBundle`.
 */
export function applyBundleSlotDetect(
  bundle: OutputBundleLike,
  opts: ResolvedSlotDetectOptions,
): void {
  if (!opts.enable) return;
  const compilerOpts = toCompilerOptions(opts);

  for (const [bundleKey, asset] of Object.entries(bundle)) {
    if (!isBundleAsset(asset)) continue;
    const fileName = asset.fileName || bundleKey;
    if (!fileName.endsWith(".wxml")) continue;

    const rawSource =
      typeof asset.source === "string"
        ? asset.source
        : new TextDecoder().decode(asset.source);

    const res = transformWxmlSlots(rawSource, compilerOpts);
    if (res.hasChanges) {
      asset.source = res.code;
    }
  }
}

function collectWxmlFiles(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === "miniprogram_npm") {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectWxmlFiles(fullPath, out);
    } else if (entry.isFile() && entry.name.endsWith(".wxml")) {
      out.push(fullPath);
    }
  }

  return out;
}

/**
 * Post-build disk sync for `weapp-vite` (which emits `.wxml` files directly to `outDir`).
 * Runs after `syncDiskAppWrapper` so `<c-app>` wrappers also receive `slots`.
 */
export function syncDiskSlotDetect(
  rootDir: string,
  outDir: string,
  opts: ResolvedSlotDetectOptions,
): void {
  if (!opts.enable) return;

  const resolvedOutDir = path.isAbsolute(outDir)
    ? outDir
    : path.resolve(rootDir, outDir);

  if (!fs.existsSync(resolvedOutDir)) return;

  const compilerOpts = toCompilerOptions(opts);
  const wxmlFiles = collectWxmlFiles(resolvedOutDir);

  for (const filePath of wxmlFiles) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const res = transformWxmlSlots(content, compilerOpts);
      if (res.hasChanges) {
        fs.writeFileSync(filePath, res.code, "utf-8");
      }
    } catch {
      // Ignore read/write errors on individual files
    }
  }
}

