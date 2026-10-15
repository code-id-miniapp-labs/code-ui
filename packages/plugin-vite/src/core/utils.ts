import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
import { type CodeUIConfig, DEFAULT_THEME_COLORS } from "@code-ui/core";

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

export function compileComponentTheme(
  componentName: string,
  factory: any,
  resolvedConfig: CodeUIConfig,
) {
  const userColors = resolvedConfig.ui?.colors
    ? Object.keys(resolvedConfig.ui.colors)
    : [];
  const allColors = Array.from(
    new Set([...DEFAULT_THEME_COLORS, ...userColors]),
  );

  const rawTheme =
    typeof factory === "function" ? factory({ colors: allColors }) : factory;

  const themeConfig = structuredClone(rawTheme);
  const overrides = resolvedConfig.components?.[componentName];

  return overrides ? mergeComponentConfig(themeConfig, overrides) : themeConfig;
}
export function extractClassesFromThemeConfig(themeConfig: any): string[] {
  const classes = new Set<string>();

  function collect(val: any) {
    if (!val) return;
    if (typeof val === "string") {
      for (const token of val.trim().split(/\s+/)) {
        if (token) classes.add(token);
      }
    } else if (Array.isArray(val)) {
      for (const item of val) collect(item);
    } else if (typeof val === "object") {
      for (const v of Object.values(val)) collect(v);
    }
  }

  if (themeConfig.base) collect(themeConfig.base);
  if (themeConfig.slots) collect(themeConfig.slots);
  if (themeConfig.variants) collect(themeConfig.variants);
  if (themeConfig.compoundVariants) {
    for (const cv of themeConfig.compoundVariants) {
      if (cv.class) collect(cv.class);
      if (cv.className) collect(cv.className);
    }
  }

  return Array.from(classes);
}

function isPlainObject(val: unknown): val is Record<string, any> {
  return Boolean(val) && typeof val === "object" && !Array.isArray(val);
}

export function mergeComponentConfig(
  base: Record<string, any> = {},
  overrides?: Record<string, any>,
): Record<string, any> {
  if (!overrides) return base;

  const result: Record<string, any> = {
    ...base,
    ...overrides,
  };

  if (base.base && overrides.base) {
    result.base = [base.base, overrides.base];
  }

  if (base.slots || overrides.slots) {
    result.slots = { ...base.slots };
    if (isPlainObject(overrides.slots)) {
      for (const [slotKey, slotVal] of Object.entries(overrides.slots)) {
        if (slotVal === undefined) continue;
        result.slots[slotKey] = base.slots?.[slotKey]
          ? [base.slots[slotKey], slotVal]
          : slotVal;
      }
    }
  }

  if (base.variants || overrides.variants) {
    result.variants = { ...base.variants };
    if (isPlainObject(overrides.variants)) {
      for (const [vGroup, vOptions] of Object.entries(overrides.variants)) {
        if (!isPlainObject(vOptions)) continue;
        const baseGroup = isPlainObject(base.variants?.[vGroup])
          ? base.variants[vGroup]
          : {};
        result.variants[vGroup] = { ...baseGroup };

        for (const [vKey, vVal] of Object.entries(vOptions)) {
          if (vVal === undefined) continue;
          const baseVal = baseGroup[vKey];

          if (isPlainObject(baseVal) && isPlainObject(vVal)) {
            const mergedSlots: Record<string, any> = { ...baseVal };
            for (const [sKey, sVal] of Object.entries(vVal)) {
              if (sVal === undefined) continue;
              mergedSlots[sKey] = baseVal[sKey] ? [baseVal[sKey], sVal] : sVal;
            }
            result.variants[vGroup][vKey] = mergedSlots;
          } else {
            result.variants[vGroup][vKey] = baseVal ? [baseVal, vVal] : vVal;
          }
        }
      }
    }
  }

  if (base.compoundVariants || overrides.compoundVariants) {
    result.compoundVariants = [
      ...(Array.isArray(base.compoundVariants) ? base.compoundVariants : []),
      ...(Array.isArray(overrides.compoundVariants)
        ? overrides.compoundVariants
        : []),
    ];
  }

  if (base.defaultVariants || overrides.defaultVariants) {
    result.defaultVariants = {
      ...base.defaultVariants,
      ...overrides.defaultVariants,
    };
  }

  return result;
}

export function mergeConfig(
  base: CodeUIConfig,
  overrides?: Partial<CodeUIConfig>,
): CodeUIConfig {
  if (!overrides) return base;

  const merged: CodeUIConfig = { ...base };

  // Avoid overwriting base properties with explicit `undefined` from options
  for (const [key, val] of Object.entries(overrides)) {
    if (val !== undefined && key !== "ui" && key !== "components") {
      (merged as Record<string, any>)[key] = val;
    }
  }

  if (base.ui || overrides.ui) {
    merged.ui = {
      ...base.ui,
      ...overrides.ui,
    };
    if (base.ui?.colors || overrides.ui?.colors) {
      merged.ui.colors = {
        ...base.ui?.colors,
        ...overrides.ui?.colors,
      };
    }
  }

  if (base.components || overrides.components) {
    const mergedComponents: NonNullable<CodeUIConfig["components"]> = {
      ...base.components,
    };

    if (isPlainObject(overrides.components)) {
      for (const [compName, compOverride] of Object.entries(
        overrides.components,
      )) {
        if (!compOverride) continue;
        mergedComponents[compName] = mergeComponentConfig(
          mergedComponents[compName],
          compOverride,
        );
      }
    }

    merged.components = mergedComponents;
  }

  return merged;
}

export function serializeFunction(fn: Function): string {
  const str = fn.toString().trim();
  if (/^(?:async\s+)?function[\s*(]/.test(str)) {
    return str;
  }
  if (/^(?:async\s+)?(?:\([^)]*\)|[a-zA-Z_$][\w$]*)\s*=>/.test(str)) {
    return str;
  }
  if (/^async\s+[a-zA-Z_$][\w$]*\s*\(/.test(str)) {
    return str.replace(/^async\s+[a-zA-Z_$][\w$]*\s*\(/, "async function (");
  }
  if (/^[a-zA-Z_$][\w$]*\s*\(/.test(str)) {
    return str.replace(/^[a-zA-Z_$][\w$]*\s*\(/, "function (");
  }
  return str;
}

export function serializeConfig(val: unknown, depth = 0): string {
  const indent = "  ".repeat(depth);
  const nextIndent = "  ".repeat(depth + 1);

  if (typeof val === "function") {
    return serializeFunction(val as Function);
  }
  if (val === null || val === undefined) {
    return JSON.stringify(val);
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return "[]";
    const items = val
      .map((item) => `${nextIndent}${serializeConfig(item, depth + 1)}`)
      .join(",\n");
    return `[\n${items}\n${indent}]`;
  }
  if (typeof val === "object") {
    const keys = Object.keys(val);
    if (keys.length === 0) return "{}";
    const entries = keys
      .map((key) => {
        const v = (val as Record<string, unknown>)[key];
        return `${nextIndent}${JSON.stringify(key)}: ${serializeConfig(v, depth + 1)}`;
      })
      .join(",\n");
    return `{\n${entries}\n${indent}}`;
  }
  return JSON.stringify(val);
}

export function cleanKeyframes(css: string): string {
  const seen = new Set<string>();
  let result = "";
  let i = 0;
  while (i < css.length) {
    const atKeyframesIdx = css.indexOf("@keyframes", i);
    if (atKeyframesIdx === -1) {
      result += css.slice(i);
      break;
    }
    result += css.slice(i, atKeyframesIdx);

    const openBraceIdx = css.indexOf("{", atKeyframesIdx);
    if (openBraceIdx === -1) {
      result += css.slice(atKeyframesIdx);
      break;
    }

    const header = css.slice(atKeyframesIdx, openBraceIdx);
    const nameMatch = header.match(/@keyframes\s+([a-zA-Z0-9_-]+)/);
    const name = nameMatch ? nameMatch[1] : null;

    let depth = 1;
    let endIdx = openBraceIdx + 1;
    while (depth > 0 && endIdx < css.length) {
      if (css[endIdx] === "{") depth++;
      else if (css[endIdx] === "}") depth--;
      endIdx++;
    }

    const block = css.slice(atKeyframesIdx, endIdx);
    if (name && seen.has(name)) {
      // Skip duplicate keyframes block
    } else {
      if (name) seen.add(name);
      result += block;
    }
    i = endIdx;
  }
  return result;
}

export function cleanKeyframesInDir(dir: string) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      cleanKeyframesInDir(fullPath);
    } else if (fullPath.endsWith(".wxss") || fullPath.endsWith(".css")) {
      try {
        const content = fs.readFileSync(fullPath, "utf8");
        const cleaned = cleanKeyframes(content);
        if (content !== cleaned) {
          fs.writeFileSync(fullPath, cleaned, "utf8");
        }
      } catch {}
    }
  }
}

