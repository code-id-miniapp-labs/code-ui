import fs from "node:fs";
import path from "node:path";
import type {
  AutoImportOptions,
  OutputBundleLike,
  ResolvedAppWrapperOptions,
  ResolvedAutoImportOptions,
} from "../types";
import { isBundleAsset } from "../types";
import { getAppPages, isPageFile } from "./app-wrapper";
import { resolveAutoImportOptions } from "./config";

const utf8Decoder = new TextDecoder();

const EXPORT_DEFAULT_PREFIX_RE = /^export\s+default\s+/;
const TRAILING_SEMI_RE = /;?\s*$/;

interface WxmlCacheEntry {
  mtimeMs: number;
  tags: string[];
}

const wxmlTagCache = new Map<string, WxmlCacheEntry>();

export function invalidateWxmlTagCache(wxmlPath?: string): void {
  if (wxmlPath) {
    wxmlTagCache.delete(wxmlPath);
  } else {
    wxmlTagCache.clear();
  }
}

function toResolvedOptions(
  opts: AutoImportOptions | ResolvedAutoImportOptions,
): ResolvedAutoImportOptions {
  if ("tagRegex" in opts && "prefixRegex" in opts) {
    return opts;
  }
  return resolveAutoImportOptions(opts);
}

function extractTagsFromWxml(
  wxmlPath: string,
  tagRegex: RegExp,
): string[] | null {
  const stat = fs.statSync(wxmlPath, { throwIfNoEntry: false });
  if (!stat || !stat.isFile()) return null;

  const cacheKey = `${wxmlPath}\0${tagRegex.source}`;
  const cached = wxmlTagCache.get(cacheKey);
  if (cached && cached.mtimeMs === stat.mtimeMs) {
    return cached.tags;
  }

  const wxmlContent = fs.readFileSync(wxmlPath, "utf-8");
  tagRegex.lastIndex = 0;

  const uniqueSet = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(wxmlContent)) !== null) {
    if (match[1]) {
      uniqueSet.add(match[1]);
    }
  }

  const tags = Array.from(uniqueSet);
  wxmlTagCache.set(cacheKey, { mtimeMs: stat.mtimeMs, tags });
  return tags;
}

function injectUsingComponents(
  json: Record<string, any>,
  uniqueTags: readonly string[],
  resolved: ResolvedAutoImportOptions,
): boolean {
  let modified = false;
  if (!json.usingComponents || typeof json.usingComponents !== "object") {
    json.usingComponents = {};
  }

  const { library, dirPrefix, suffix, prefixRegex } = resolved;

  for (const tag of uniqueTags) {
    if (!json.usingComponents[tag]) {
      const componentName = tag.replace(prefixRegex, "");
      json.usingComponents[tag] =
        `${library}/${dirPrefix}${componentName}${suffix}`;
      modified = true;
    }
  }

  return modified;
}

export function transformAutoImport(
  code: string,
  id: string,
  autoImportOpts: AutoImportOptions | ResolvedAutoImportOptions,
  projectRoot?: string,
  appWrapperOpts?: ResolvedAppWrapperOptions,
): { code: string; map: null } | null {
  const resolved = toResolvedOptions(autoImportOpts);
  if (!resolved.enable) return null;

  const qIdx = id.indexOf("?");
  const cleanId = qIdx === -1 ? id : id.slice(0, qIdx);
  if (!cleanId || !cleanId.endsWith(".json")) {
    return null;
  }

  const wxmlPath = cleanId.slice(0, -5) + ".wxml";

  try {
    const extracted = extractTagsFromWxml(wxmlPath, resolved.tagRegex);
    const tagsSet = new Set<string>(extracted ?? []);
    if (
      projectRoot &&
      appWrapperOpts &&
      appWrapperOpts.enable &&
      isPageFile(cleanId, projectRoot, getAppPages(projectRoot), appWrapperOpts)
    ) {
      tagsSet.add(appWrapperOpts.tag);
    }
    const uniqueTags = Array.from(tagsSet);
    if (uniqueTags.length === 0) return null;

    let isExportDefault = false;
    let isStringExport = false;
    let jsonStr = code.trim();
    if (jsonStr.startsWith("export default")) {
      isExportDefault = true;
      jsonStr = jsonStr
        .replace(EXPORT_DEFAULT_PREFIX_RE, "")
        .replace(TRAILING_SEMI_RE, "");
    }

    let json: unknown;
    try {
      json = JSON.parse(jsonStr);
    } catch {
      return null;
    }

    if (typeof json === "string") {
      const trimmed = json.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
          json = JSON.parse(trimmed);
          isStringExport = true;
        } catch {
          return null;
        }
      } else {
        return null;
      }
    }

    if (!json || typeof json !== "object" || Array.isArray(json)) {
      return null;
    }

    const modified = injectUsingComponents(
      json as Record<string, any>,
      uniqueTags,
      resolved,
    );

    if (modified) {
      const resultStr = JSON.stringify(json, null, 2);
      const finalCode = isExportDefault
        ? isStringExport
          ? `export default ${JSON.stringify(resultStr)};`
          : `export default ${resultStr};`
        : resultStr;
      return { code: finalCode, map: null };
    }
  } catch (err) {
    console.warn(`[code-ui:auto-import] Failed to process ${cleanId}:`, err);
  }

  return null;
}

export function generateBundleAutoImport(
  bundle: OutputBundleLike,
  autoImportOpts: AutoImportOptions | ResolvedAutoImportOptions,
  projectRoot: string,
  appWrapperOpts?: ResolvedAppWrapperOptions,
): Set<string> {
  const updatedFiles = new Set<string>();
  const resolved = toResolvedOptions(autoImportOpts);
  if (!resolved.enable) return updatedFiles;

  const srcRoot = path.resolve(projectRoot, "src");
  const pages = appWrapperOpts?.enable ? getAppPages(projectRoot) : undefined;

  for (const [fileName, item] of Object.entries(bundle)) {
    if (!fileName.endsWith(".json") || !isBundleAsset(item)) continue;

    const normalizedFileName = fileName.replace(/\\/g, "/");
    updatedFiles.add(normalizedFileName);

    const source =
      typeof item.source === "string"
        ? item.source
        : item.source instanceof Uint8Array
          ? utf8Decoder.decode(item.source)
          : undefined;
    if (!source) continue;

    const relWxml = normalizedFileName.slice(0, -5) + ".wxml";
    const candidateInSrc = path.resolve(srcRoot, relWxml);
    let uniqueTags = extractTagsFromWxml(candidateInSrc, resolved.tagRegex);

    if (uniqueTags === null) {
      const candidateInRoot = path.resolve(projectRoot, relWxml);
      uniqueTags = extractTagsFromWxml(candidateInRoot, resolved.tagRegex);
    }

    const tagsSet = new Set<string>(uniqueTags ?? []);
    if (pages && appWrapperOpts) {
      const candidateFile = fs.existsSync(candidateInSrc)
        ? candidateInSrc
        : path.resolve(projectRoot, relWxml);
      if (isPageFile(candidateFile, projectRoot, pages, appWrapperOpts)) {
        tagsSet.add(appWrapperOpts.tag);
      }
    }

    const finalTags = Array.from(tagsSet);
    if (finalTags.length === 0) continue;

    try {
      const json = JSON.parse(source);
      if (!json || typeof json !== "object" || Array.isArray(json)) continue;

      if (injectUsingComponents(json, finalTags, resolved)) {
        item.source = JSON.stringify(json, null, 2);
      }
    } catch (err) {
      console.warn(
        `[code-ui:generateBundle] Failed to update ${fileName}:`,
        err,
      );
    }
  }

  return updatedFiles;
}

export function syncDiskAutoImport(
  distRoot: string,
  autoImportOpts: AutoImportOptions | ResolvedAutoImportOptions,
  projectRoot: string,
  skipRelPaths?: ReadonlySet<string>,
  appWrapperOpts?: ResolvedAppWrapperOptions,
): void {
  const resolved = toResolvedOptions(autoImportOpts);
  if (!resolved.enable || !fs.existsSync(distRoot)) return;

  const srcRoot = path.resolve(projectRoot, "src");
  const pages = appWrapperOpts?.enable ? getAppPages(projectRoot) : undefined;

  function scanDir(dir: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.name === "miniprogram_npm" || entry.name === "node_modules") {
        continue;
      }
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        const relJson = path
          .relative(distRoot, fullPath)
          .replace(/\\/g, "/");
        if (skipRelPaths?.has(relJson)) continue;

        const relWxml = relJson.slice(0, -5) + ".wxml";
        const candidateInSrc = path.resolve(srcRoot, relWxml);
        let uniqueTags = extractTagsFromWxml(candidateInSrc, resolved.tagRegex);

        if (uniqueTags === null) {
          const candidateInRoot = path.resolve(projectRoot, relWxml);
          uniqueTags = extractTagsFromWxml(candidateInRoot, resolved.tagRegex);
        }

        const tagsSet = new Set<string>(uniqueTags ?? []);
        if (pages && appWrapperOpts) {
          const candidateFile = fs.existsSync(candidateInSrc)
            ? candidateInSrc
            : path.resolve(projectRoot, relWxml);
          if (isPageFile(candidateFile, projectRoot, pages, appWrapperOpts)) {
            tagsSet.add(appWrapperOpts.tag);
          }
        }

        const finalTags = Array.from(tagsSet);
        if (finalTags.length === 0) continue;

        try {
          const content = fs.readFileSync(fullPath, "utf-8");
          const json = JSON.parse(content);
          if (!json || typeof json !== "object" || Array.isArray(json)) {
            continue;
          }

          if (injectUsingComponents(json, finalTags, resolved)) {
            fs.writeFileSync(fullPath, JSON.stringify(json, null, 2), "utf-8");
          }
        } catch (err) {
          console.warn(
            `[code-ui:auto-import] Failed to sync disk JSON ${relJson}:`,
            err,
          );
        }
      }
    }
  }

  scanDir(distRoot);
}

