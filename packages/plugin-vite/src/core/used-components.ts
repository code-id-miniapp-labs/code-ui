import fs from "node:fs";
import path from "node:path";

const SKIP_DIRS = new Set([
  "node_modules",
  "miniprogram_npm",
  "dist",
  ".git",
  ".cache",
  "coverage",
  "unpackage",
]);

const TAG_RE = /<([a-zA-Z][a-zA-Z0-9-]*)[\s>/]/g;
const DYNAMIC_COMPONENT_RE = /<\s*component\b|\bis\s*=\s*["'][^"']*\{\{/;

export function toKebabCase(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

export function toCamelCase(str: string): string {
  return str.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

/**
 * Built-in component dependency map.
 * When a parent/host component is used, its child components and shared
 * icons are automatically included in the stylesheet compilation scan.
 */
export const COMPONENT_DEPENDENCIES: Record<string, readonly string[]> = {
  accordion: ["accordion-item", "icon"],
  "accordion-item": ["icon"],
  stepper: ["stepper-item", "icon"],
  "stepper-item": ["icon"],
  "avatar-group": ["avatar", "icon"],
  avatar: ["icon"],
  badge: ["icon"],
  button: ["icon"],
  card: ["icon"],
  checkbox: ["icon"],
  "checkbox-group": ["checkbox", "icon"],
  chip: ["icon"],
  divider: ["icon"],
  drawer: ["icon"],
  form: ["form-field", "icon"],
  "form-field": ["icon"],
  input: ["icon"],
  "pin-input": ["icon"],
  "radio-group": ["radio", "icon"],
  radio: ["icon"],
  switch: ["icon"],
  textarea: ["icon"],
};

function matchComponentName(
  tag: string,
  normalizedKnown: ReadonlyMap<string, string>,
): string | null {
  let candidate = toKebabCase(tag);
  while (candidate) {
    const matched = normalizedKnown.get(candidate);
    if (matched) return matched;
    const separator = candidate.indexOf("-");
    if (separator === -1) return null;
    candidate = candidate.slice(separator + 1);
  }
  return null;
}

function componentNameFromPath(
  value: unknown,
  normalizedKnown: ReadonlyMap<string, string>,
): string | null {
  if (typeof value !== "string") return null;

  const clean = value.split("?")[0]?.split("#")[0] ?? "";
  const segments = clean.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  let candidate = segments[segments.length - 1] ?? "";
  if (candidate === "index" || candidate.startsWith("index.")) {
    candidate = segments[segments.length - 2] ?? "";
  }
  candidate = candidate.replace(/\.[a-z0-9]+$/i, "");

  return matchComponentName(candidate, normalizedKnown);
}

/**
 * Collect the `@code-ui/components` names referenced by WXML tags or
 * `usingComponents` entries under `root`.
 *
 * Returns `null` when the scan cannot safely determine the used set, so the
 * caller can fall back to including every theme.
 */
export interface UsedComponentsScan {
  components: Set<string>;
  files: string[];
}

export function collectUsedComponents(
  root: string,
  knownComponents: ReadonlySet<string>,
): UsedComponentsScan | null {
  const normalizedKnown = new Map<string, string>();
  for (const name of knownComponents) {
    const kebab = toKebabCase(name);
    normalizedKnown.set(kebab, kebab);
    normalizedKnown.set(toCamelCase(name), kebab);
    normalizedKnown.set(name.toLowerCase(), kebab);
  }

  const rawComponents = new Set<string>();
  const files: string[] = [];
  let dynamic = false;

  function scanDir(dir: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue;

      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;

      if (entry.name.endsWith(".wxml")) {
        files.push(fullPath);
        let content: string;
        try {
          content = fs.readFileSync(fullPath, "utf-8");
        } catch {
          continue;
        }

        if (DYNAMIC_COMPONENT_RE.test(content)) {
          dynamic = true;
        }

        TAG_RE.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = TAG_RE.exec(content)) !== null) {
          const tag = match[1];
          if (!tag || !tag.includes("-")) continue;
          const name = matchComponentName(tag, normalizedKnown);
          if (name) rawComponents.add(name);
        }
        continue;
      }

      if (entry.name.endsWith(".json")) {
        files.push(fullPath);
        let content: string;
        try {
          content = fs.readFileSync(fullPath, "utf-8");
        } catch {
          continue;
        }
        if (!content.includes("usingComponents")) continue;

        let json: any;
        try {
          json = JSON.parse(content);
        } catch {
          continue;
        }

        const usingComponents = json?.usingComponents;
        if (!usingComponents || typeof usingComponents !== "object") continue;

        for (const [tag, target] of Object.entries(usingComponents)) {
          const name =
            matchComponentName(tag, normalizedKnown) ??
            componentNameFromPath(target, normalizedKnown);
          if (name) rawComponents.add(name);
        }
      }
    }
  }

  scanDir(root);

  if (dynamic || files.length === 0) {
    return null;
  }

  const components = new Set<string>();
  function addWithDeps(name: string): void {
    const canonical = normalizedKnown.get(name) ?? toKebabCase(name);
    if (!canonical || components.has(canonical)) return;
    components.add(canonical);

    const deps = COMPONENT_DEPENDENCIES[canonical];
    if (deps) {
      for (const dep of deps) {
        if (normalizedKnown.has(dep)) {
          addWithDeps(dep);
        }
      }
    }
  }

  for (const name of rawComponents) {
    addWithDeps(name);
  }

  return { components, files };
}
