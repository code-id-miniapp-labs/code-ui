import type { IconsConfig } from "./config";

function readIconsConfig(): IconsConfig {
  const host =
    typeof globalThis !== "undefined"
      ? (globalThis as Record<string, any>)
      : typeof window !== "undefined"
        ? (window as unknown as Record<string, any>)
        : typeof global !== "undefined"
          ? (global as unknown as Record<string, any>)
          : undefined;
  return (host?.__CODE_UI_GLOBAL_CONFIG__?.icons ?? {}) as IconsConfig;
}

const mkPreset = <
  C extends string,
  L extends string,
  U extends string,
  F extends string,
>(
  close: C,
  loading: L,
  upload: U,
  file: F,
) =>
  ({
    check: "check",
    minus: "minus",
    close,
    loading,
    chevronDown: "chevron-down",
    upload,
    file,
  }) as const;

/**
 * Built-in icon mappings for popular Iconify collections.
 */
export const ICON_COLLECTION_PRESETS = {
  lucide: /* @__PURE__ */ mkPreset("x", "loader", "upload", "file"),
  tabler: /* @__PURE__ */ mkPreset("x", "loader-2", "upload", "file"),
  mdi: /* @__PURE__ */ mkPreset("close", "loading", "upload", "file"),
  heroicons: /* @__PURE__ */ mkPreset(
    "x-mark",
    "arrow-path",
    "arrow-up-tray",
    "document",
  ),
} as const;

export type DefaultIconName = keyof (typeof ICON_COLLECTION_PRESETS)["lucide"];

export type ResolvedIcons = Record<DefaultIconName, string> &
  Record<string, string>;

const ICON_KEYS = [
  "check",
  "minus",
  "close",
  "loading",
  "chevronDown",
  "upload",
  "file",
] as const;

/**
 * Resolves all active icon collection names from configuration.
 * Always ensures at least one collection (defaults to "lucide").
 * The first item in the returned array is the primary collection.
 */
export function getActiveCollections(iconsConfig?: IconsConfig): string[] {
  const cfg = iconsConfig ?? readIconsConfig();
  const list: string[] = [];

  const rawCollections = cfg.collections;
  if (Array.isArray(rawCollections)) {
    for (const c of rawCollections) {
      if (typeof c === "string" && !list.includes(c)) list.push(c);
    }
  } else if (
    typeof rawCollections === "string" &&
    !list.includes(rawCollections)
  ) {
    list.push(rawCollections);
  }

  return list;
}

/**
 * Returns the active icon map (built-in defaults merged with `config.icons`).
 */
export function getIcons(): ResolvedIcons {
  const iconsConfig: IconsConfig = readIconsConfig();
  const prefix =
    typeof iconsConfig.prefix === "string" ? iconsConfig.prefix : "i";
  const collections = getActiveCollections(iconsConfig);
  const primary = collections[0] || "lucide";

  const result: Record<string, string> = {};
  const primaryPreset =
    ICON_COLLECTION_PRESETS[primary as keyof typeof ICON_COLLECTION_PRESETS];
  for (const k of ICON_KEYS) {
    result[k] = `${prefix}-${primary}-${primaryPreset ? primaryPreset[k] : k === "chevronDown" ? "chevron-down" : k}`;
  }

  for (const col of collections) {
    const preset =
      ICON_COLLECTION_PRESETS[col as keyof typeof ICON_COLLECTION_PRESETS];
    if (preset) {
      for (const k of ICON_KEYS) {
        result[`${col}:${k}`] = `${prefix}-${col}-${preset[k]}`;
      }
    }
  }

  for (const [key, val] of Object.entries(iconsConfig)) {
    if (key === "collection" || key === "collections" || key === "prefix")
      continue;
    if (val && typeof val === "string") result[key] = val;
  }
  return result as ResolvedIcons;
}

/**
 * Resolves a single icon alias, e.g. `getIcon("check")` → `"i-lucide-check"`.
 * Also supports Iconify standard namespacing: `getIcon("tabler:home")` → `"i-tabler-home"`.
 * Returns an empty string for unknown aliases.
 */
export function getIcon(name: DefaultIconName | (string & {})): string {
  if (!name) return "";
  const icons = getIcons();
  if (name in icons) {
    return icons[name] ?? "";
  }
  if (name.includes(":")) {
    const colonIdx = name.indexOf(":");
    const col = name.slice(0, colonIdx);
    const icon = name.slice(colonIdx + 1);
    if (col && icon) {
      const iconsConfig: IconsConfig = readIconsConfig();
      const prefix =
        typeof iconsConfig.prefix === "string" ? iconsConfig.prefix : "i";
      return `${prefix}-${col}-${icon}`;
    }
  }
  return "";
}
