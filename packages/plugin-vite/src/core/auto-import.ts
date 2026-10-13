import fs from "node:fs";
import path from "node:path";
import type { AutoImportOptions } from "../index";

export function transformAutoImport(
  code: string,
  id: string,
  autoImportOpts: AutoImportOptions,
): { code: string; map: null } | null {
  const cleanId = id.split("?")[0];
  if (!cleanId || !autoImportOpts.enable || !cleanId.endsWith(".json")) {
    return null;
  }

  const wxmlPath = cleanId.replace(/\.json$/, ".wxml");
  if (!fs.existsSync(wxmlPath)) return null;

  const prefix = autoImportOpts.prefix || "c";
  const library = autoImportOpts.library || "@code-ui/components";
  const tagRegex = new RegExp(`<(${prefix}-[a-zA-Z0-9-]+)[\\s>\\/]`, "g");

  try {
    const wxmlContent = fs.readFileSync(wxmlPath, "utf-8");
    const matches = Array.from(wxmlContent.matchAll(tagRegex));

    if (matches.length === 0) return null;

    const uniqueTags = [
      ...new Set(matches.map((m) => m[1]).filter(Boolean)),
    ] as string[];
    let isExportDefault = false;
    let isStringExport = false;
    let jsonStr = code.trim();
    if (jsonStr.startsWith("export default")) {
      isExportDefault = true;
      jsonStr = jsonStr
        .replace(/^export\s+default\s+/, "")
        .replace(/;?\s*$/, "");
    }

    let json: any;
    try {
      json = JSON.parse(jsonStr);
    } catch {
      try {
        json = new Function(`return (${jsonStr})`)();
      } catch {
        return null;
      }
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

    let modified = false;
    json.usingComponents = json.usingComponents || {};

    const compDir =
      autoImportOpts.componentDir !== undefined
        ? autoImportOpts.componentDir
        : library === "@code-ui/components"
          ? "runtime"
          : "";
    const dirPrefix = compDir ? `${compDir}/` : "";

    for (const tag of uniqueTags) {
      if (!json.usingComponents[tag]) {
        const componentName = tag.replace(new RegExp(`^${prefix}-`), "");
        const suffix =
          autoImportOpts.componentSuffix !== undefined
            ? autoImportOpts.componentSuffix
            : "/index";
        json.usingComponents[tag] =
          `${library}/${dirPrefix}${componentName}${suffix}`;
        modified = true;
      }
    }

    if (modified) {
      const resultStr = JSON.stringify(json, null, 2);
      let finalCode: string;
      if (isExportDefault) {
        if (isStringExport) {
          finalCode = `export default ${JSON.stringify(resultStr)};`;
        } else {
          finalCode = `export default ${resultStr};`;
        }
      } else {
        finalCode = resultStr;
      }
      return { code: finalCode, map: null };
    }
  } catch (err) {
    console.warn(`[code-ui:auto-import] Failed to process ${cleanId}:`, err);
  }

  return null;
}

export function generateBundleAutoImport(
  bundle: any,
  autoImportOpts: AutoImportOptions,
  projectRoot: string,
) {
  if (!autoImportOpts.enable) return;

  const prefix = autoImportOpts.prefix || "c";
  const library = autoImportOpts.library || "@code-ui/components";
  const compDir =
    autoImportOpts.componentDir !== undefined
      ? autoImportOpts.componentDir
      : library === "@code-ui/components"
        ? "runtime"
        : "";
  const dirPrefix = compDir ? `${compDir}/` : "";
  const suffix =
    autoImportOpts.componentSuffix !== undefined
      ? autoImportOpts.componentSuffix
      : "/index";

  for (const [fileName, item] of Object.entries(bundle)) {
    // @ts-ignore
    if (item.type !== "asset" || !fileName.endsWith(".json")) continue;
    // @ts-ignore
    const source =
      // @ts-ignore
      typeof item.source === "string"
        ? // @ts-ignore
          item.source
        : // @ts-ignore
          item.source instanceof Uint8Array
          ? // @ts-ignore
            new TextDecoder().decode(item.source)
          : undefined;
    if (!source) continue;

    const candidates = [
      path.resolve(projectRoot, "src", fileName.replace(/\.json$/, ".wxml")),
      path.resolve(projectRoot, fileName.replace(/\.json$/, ".wxml")),
    ];

    let wxmlPath: string | null = null;
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        wxmlPath = p;
        break;
      }
    }

    if (!wxmlPath) continue;

    try {
      const wxmlContent = fs.readFileSync(wxmlPath, "utf-8");
      const matches = Array.from(
        wxmlContent.matchAll(
          new RegExp(`<(${prefix}-[a-zA-Z0-9-]+)[\\s>\\/]`, "g"),
        ),
      );
      if (matches.length === 0) continue;

      const uniqueTags = [
        ...new Set(matches.map((m) => m[1]).filter(Boolean)),
      ] as string[];
      const json = JSON.parse(source);
      json.usingComponents = json.usingComponents || {};

      let modified = false;
      for (const tag of uniqueTags) {
        if (!json.usingComponents[tag]) {
          const componentName = tag.replace(new RegExp(`^${prefix}-`), "");
          json.usingComponents[tag] =
            `${library}/${dirPrefix}${componentName}${suffix}`;
          modified = true;
        }
      }

      if (modified) {
        // @ts-ignore
        item.source = JSON.stringify(json, null, 2);
      }
    } catch (err) {
      console.warn(
        `[code-ui:generateBundle] Failed to update ${fileName}:`,
        err,
      );
    }
  }
}
