import fs from "node:fs";
import path from "node:path";
import type { OutputBundleLike, ResolvedAppWrapperOptions } from "../types";
import { isBundleAsset } from "../types";

const utf8Decoder = new TextDecoder();

interface AppPagesCacheEntry {
  mtimeMs: number;
  pages: Set<string>;
}

const appPagesCache = new Map<string, AppPagesCacheEntry>();

export function invalidateAppPagesCache(projectRoot?: string): void {
  if (projectRoot) {
    appPagesCache.delete(projectRoot);
  } else {
    appPagesCache.clear();
  }
}

function findAppJsonPath(projectRoot: string): string | null {
  const candidateSrc = path.resolve(projectRoot, "src/app.json");
  if (fs.existsSync(candidateSrc)) {
    return candidateSrc;
  }
  const candidateRoot = path.resolve(projectRoot, "app.json");
  if (fs.existsSync(candidateRoot)) {
    return candidateRoot;
  }
  return null;
}

export function getAppPages(projectRoot: string): Set<string> {
  const appJsonPath = findAppJsonPath(projectRoot);
  if (!appJsonPath) {
    return new Set<string>();
  }

  const stat = fs.statSync(appJsonPath, { throwIfNoEntry: false });
  if (!stat || !stat.isFile()) {
    return new Set<string>();
  }

  const cached = appPagesCache.get(projectRoot);
  if (cached && cached.mtimeMs === stat.mtimeMs) {
    return cached.pages;
  }

  const pagesSet = new Set<string>();

  try {
    const rawContent = fs.readFileSync(appJsonPath, "utf-8");
    const parsed = JSON.parse(rawContent);

    if (Array.isArray(parsed.pages)) {
      for (const p of parsed.pages) {
        if (typeof p === "string" && p.trim()) {
          const normalized = p
            .trim()
            .replace(/^\/+|\/+$/g, "")
            .replace(/\\/g, "/");
          pagesSet.add(normalized);
        }
      }
    }

    const subPackages = Array.isArray(parsed.subPackages)
      ? parsed.subPackages
      : Array.isArray(parsed.subpackages)
        ? parsed.subpackages
        : [];

    for (const sub of subPackages) {
      if (!sub || typeof sub !== "object") continue;
      const root =
        typeof sub.root === "string"
          ? sub.root
              .trim()
              .replace(/^\/+|\/+$/g, "")
              .replace(/\\/g, "/")
          : "";
      if (!root || !Array.isArray(sub.pages)) continue;

      for (const p of sub.pages) {
        if (typeof p === "string" && p.trim()) {
          const normalizedPage = p
            .trim()
            .replace(/^\/+|\/+$/g, "")
            .replace(/\\/g, "/");
          pagesSet.add(`${root}/${normalizedPage}`);
        }
      }
    }
  } catch (err) {
    console.warn(`[code-ui:app-wrapper] Failed to parse ${appJsonPath}:`, err);
  }

  appPagesCache.set(projectRoot, { mtimeMs: stat.mtimeMs, pages: pagesSet });
  return pagesSet;
}

export function normalizePagePath(
  filePath: string,
  projectRoot: string,
): string {
  let rel = path.relative(projectRoot, filePath).replace(/\\/g, "/");
  rel = rel.replace(/^\/+/, "");

  if (rel.startsWith("src/")) {
    rel = rel.slice(4);
  } else if (rel.startsWith("dist/")) {
    rel = rel.slice(5);
  }

  // Strip extension
  const ext = path.extname(rel);
  if (ext) {
    rel = rel.slice(0, -ext.length);
  }

  return rel;
}

function matchPattern(route: string, pattern: string | RegExp): boolean {
  if (pattern instanceof RegExp) {
    return pattern.test(route);
  }
  if (pattern.includes("*")) {
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*\*/g, ".*")
      .replace(/\*/g, "[^/]*");
    return new RegExp(`^${escaped}$`).test(route);
  }
  return route === pattern || route.startsWith(`${pattern}/`);
}

export function isPageFile(
  filePath: string,
  projectRoot: string,
  pages: Set<string>,
  options: ResolvedAppWrapperOptions,
): boolean {
  const route = normalizePagePath(filePath, projectRoot);
  if (!pages.has(route)) {
    return false;
  }

  // Check if companion .json declares "component": true
  const dir = path.dirname(filePath);
  const baseName = path.basename(filePath, path.extname(filePath));
  const companionJson = path.join(dir, `${baseName}.json`);

  if (fs.existsSync(companionJson)) {
    try {
      const jsonContent = fs.readFileSync(companionJson, "utf-8");
      const parsed = JSON.parse(jsonContent);
      if (parsed && typeof parsed === "object" && parsed.component === true) {
        return false;
      }
    } catch {
      // Ignore JSON parse errors on companion check
    }
  }

  if (options.include && options.include.length > 0) {
    const isIncluded = options.include.some((pat) => matchPattern(route, pat));
    if (!isIncluded) return false;
  }

  if (options.exclude && options.exclude.length > 0) {
    const isExcluded = options.exclude.some((pat) => matchPattern(route, pat));
    if (isExcluded) return false;
  }

  return true;
}

function formatProps(
  defaultProps?: Record<string, string | boolean | number>,
): string {
  if (!defaultProps) return "";
  const parts: string[] = [];
  for (const [key, val] of Object.entries(defaultProps)) {
    if (val === true) {
      parts.push(key);
    } else if (val === false) {
      parts.push(`${key}="{{ false }}"`);
    } else if (typeof val === "number") {
      parts.push(`${key}="{{ ${val} }}"`);
    } else if (typeof val === "string") {
      parts.push(`${key}="${val.replace(/"/g, "&quot;")}"`);
    }
  }
  return parts.length > 0 ? " " + parts.join(" ") : "";
}

const PAGE_META_PAIRED_RE = /<page-meta\b[\s\S]*?<\/page-meta>/i;
const PAGE_META_SELF_CLOSING_RE = /<page-meta\b[^>]*\/>/i;

function mergePageMetaStyle(pageMetaXml: string): string {
  const pageStyleDoubleQuote = /\bpage-style="([^"]*)"/i;
  const pageStyleSingleQuote = /\bpage-style='([^']*)'/i;

  if (pageStyleDoubleQuote.test(pageMetaXml)) {
    return pageMetaXml.replace(pageStyleDoubleQuote, (_m, val) => {
      if (val.includes("cuiPageStyle")) return _m;
      const trimmed = val.trim();
      const sep = trimmed && !trimmed.endsWith(";") ? "; " : trimmed ? " " : "";
      return `page-style="${trimmed}${sep}{{ cuiPageStyle }}"`;
    });
  }

  if (pageStyleSingleQuote.test(pageMetaXml)) {
    return pageMetaXml.replace(pageStyleSingleQuote, (_m, val) => {
      if (val.includes("cuiPageStyle")) return _m;
      const trimmed = val.trim();
      const sep = trimmed && !trimmed.endsWith(";") ? "; " : trimmed ? " " : "";
      return `page-style='${trimmed}${sep}{{ cuiPageStyle }}'`;
    });
  }

  return pageMetaXml.replace(
    /<page-meta\b/i,
    '<page-meta page-style="{{ cuiPageStyle }}"',
  );
}

export function hasAppWrapperTag(code: string, tag: string): boolean {
  // Strip XML comments
  const withoutComments = code.replace(/<!--[\s\S]*?-->/g, "");

  // Strip Mustache expressions
  const withoutMustache = withoutComments.replace(/\{\{[\s\S]*?\}\}/g, "");

  // Strip quoted attribute values ("..." and '...') to ignore <c-app> mentions inside text or attributes
  const outsideQuotes = withoutMustache
    .replace(/"[^"]*"/g, '""')
    .replace(/'[^']*'/g, "''");

  const tagPattern = new RegExp(`<\\s*(?:${tag}|c-app|cui-app)[\\s>/]`, "i");
  return tagPattern.test(outsideQuotes);
}

export function wrapPageWxml(
  code: string,
  options: ResolvedAppWrapperOptions,
): string {
  const { tag, defaultProps, pageMeta = false } = options;

  // Check if already contains app wrapper tag
  if (hasAppWrapperTag(code, tag)) {
    if (!pageMeta) return code;
    const match =
      PAGE_META_PAIRED_RE.exec(code) || PAGE_META_SELF_CLOSING_RE.exec(code);
    if (match) {
      const merged = mergePageMetaStyle(match[0]);
      if (merged !== match[0]) {
        return (
          code.slice(0, match.index) +
          merged +
          code.slice(match.index + match[0].length)
        );
      }
      return code;
    }
    return `<page-meta page-style="{{ cuiPageStyle }}" />\n${code}`;
  }

  const propsStr = formatProps(defaultProps);
  const openTag = `<${tag}${propsStr}>`;
  const closeTag = `</${tag}>`;

  // Check for <page-meta>
  const match =
    PAGE_META_PAIRED_RE.exec(code) || PAGE_META_SELF_CLOSING_RE.exec(code);
  if (match) {
    const matchIndex = match.index;
    const matchLength = match[0].length;
    const beforeRaw = code.slice(0, matchIndex + matchLength).trimEnd();
    const before = pageMeta ? mergePageMetaStyle(beforeRaw) : beforeRaw;
    const after = code.slice(matchIndex + matchLength).trim();

    if (!after) {
      return `${before}\n${openTag}\n${closeTag}\n`;
    }
    return `${before}\n${openTag}\n${after}\n${closeTag}\n`;
  }

  const trimmed = code.trim();
  const pageMetaTag = pageMeta
    ? `<page-meta page-style="{{ cuiPageStyle }}" />\n`
    : "";

  if (!trimmed) {
    return `${pageMetaTag}${openTag}\n${closeTag}\n`;
  }

  return `${pageMetaTag}${openTag}\n${trimmed}\n${closeTag}\n`;
}

export function transformAppWrapper(
  code: string,
  id: string,
  projectRoot: string,
  options: ResolvedAppWrapperOptions,
): { code: string; map: null } | null {
  if (!options.enable) return null;

  const qIdx = id.indexOf("?");
  const cleanId = qIdx === -1 ? id : id.slice(0, qIdx);
  if (!cleanId || !cleanId.endsWith(".wxml")) return null;

  const pages = getAppPages(projectRoot);
  if (!isPageFile(cleanId, projectRoot, pages, options)) {
    return null;
  }

  const trimmed = code.trim();
  if (trimmed.startsWith("export default")) {
    const strMatch =
      /^export\s+default\s+((?:["'`])[\s\S]*(?:["'`]))\s*;?$/.exec(trimmed);
    if (strMatch && strMatch[1]) {
      try {
        const rawTemplate = JSON.parse(strMatch[1]);
        if (typeof rawTemplate === "string") {
          const wrapped = wrapPageWxml(rawTemplate, options);
          if (wrapped !== rawTemplate) {
            return {
              code: `export default ${JSON.stringify(wrapped)};\n`,
              map: null,
            };
          }
        }
      } catch {
        // If template string is not direct JSON, ignore
      }
    }
    return null;
  }

  const wrapped = wrapPageWxml(code, options);
  if (wrapped === code) {
    return null;
  }

  return { code: wrapped, map: null };
}

export function generateBundleAppWrapper(
  bundle: OutputBundleLike,
  options: ResolvedAppWrapperOptions,
  projectRoot: string,
): Set<string> {
  const wrappedFiles = new Set<string>();
  if (!options.enable) return wrappedFiles;

  const pages = getAppPages(projectRoot);
  const srcRoot = path.resolve(projectRoot, "src");

  for (const [fileName, item] of Object.entries(bundle)) {
    if (!fileName.endsWith(".wxml") || !isBundleAsset(item)) continue;

    const normalizedFileName = fileName.replace(/\\/g, "/");
    const source =
      typeof item.source === "string"
        ? item.source
        : item.source instanceof Uint8Array
          ? utf8Decoder.decode(item.source)
          : undefined;
    if (!source) continue;

    const candidateInSrc = path.resolve(srcRoot, normalizedFileName);
    const candidateInRoot = path.resolve(projectRoot, normalizedFileName);
    const checkFile = fs.existsSync(candidateInSrc)
      ? candidateInSrc
      : candidateInRoot;

    if (isPageFile(checkFile, projectRoot, pages, options)) {
      const wrapped = wrapPageWxml(source, options);
      if (wrapped !== source) {
        item.source = wrapped;
        wrappedFiles.add(normalizedFileName);
      }
    }
  }

  return wrappedFiles;
}

export function syncDiskAppWrapper(
  distRoot: string,
  options: ResolvedAppWrapperOptions,
  projectRoot: string,
  skipRelPaths?: ReadonlySet<string>,
): void {
  if (!options.enable || !fs.existsSync(distRoot)) return;

  const pages = getAppPages(projectRoot);
  const srcRoot = path.resolve(projectRoot, "src");

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
      } else if (entry.isFile() && entry.name.endsWith(".wxml")) {
        const relWxml = path.relative(distRoot, fullPath).replace(/\\/g, "/");
        if (skipRelPaths?.has(relWxml)) continue;

        const candidateInSrc = path.resolve(srcRoot, relWxml);
        const candidateInRoot = path.resolve(projectRoot, relWxml);
        const checkFile = fs.existsSync(candidateInSrc)
          ? candidateInSrc
          : candidateInRoot;

        if (isPageFile(checkFile, projectRoot, pages, options)) {
          try {
            const content = fs.readFileSync(fullPath, "utf-8");
            const wrapped = wrapPageWxml(content, options);
            if (wrapped !== content) {
              fs.writeFileSync(fullPath, wrapped, "utf-8");
            }
          } catch (err) {
            console.warn(
              `[code-ui:app-wrapper] Failed to sync disk WXML ${relWxml}:`,
              err,
            );
          }
        }
      }
    }
  }

  scanDir(distRoot);
}
