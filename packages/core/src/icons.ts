import type { IconsConfig } from "./config";

const CONFIG_RESERVED_KEYS = new Set(["collection", "collections", "prefix"]);

/**
 * Safely retrieves the global host object across modern and legacy environments.
 */
function getGlobalHost(): Record<string, any> | undefined {
  if (typeof globalThis !== "undefined") return globalThis;
  if (typeof window !== "undefined") return window;
  if (typeof global !== "undefined") return global;
  return undefined;
}

function readIconsConfig(): IconsConfig {
  const host = getGlobalHost();
  return (host?.__CODE_UI_GLOBAL_CONFIG__?.icons ?? {}) as IconsConfig;
}

function getPrefix(config: IconsConfig): string {
  return typeof config.prefix === "string" ? config.prefix : "i";
}

export const BASE_ICON_PRESET = {
  check: "check",
  minus: "minus",
  close: "close",
  loading: "loading",
  chevronDown: "chevron-down",
  chevronRight: "chevron-right",
  chevronLeft: "chevron-left",
  chevronUp: "chevron-up",
  upload: "upload",
  file: "file",
  more: "ellipsis-vertical",
} as const;

export type DefaultIconName = keyof typeof BASE_ICON_PRESET;

export const ICON_KEYS = Object.keys(
  BASE_ICON_PRESET,
) as readonly DefaultIconName[];

const mkPreset = <const T extends Partial<Record<DefaultIconName, string>>>(
  overrides: T,
) =>
  ({
    ...BASE_ICON_PRESET,
    ...overrides,
  }) as const;

/**
 * Built-in icon mappings for popular Iconify collections.
 */
export const ICON_COLLECTION_PRESETS = {
  lucide: /* @__PURE__ */ mkPreset({
    close: "x",
    loading: "loader",
  }),
  tabler: /* @__PURE__ */ mkPreset({
    close: "x",
    loading: "loader-2",
    more: "dots-vertical",
  }),
  mdi: /* @__PURE__ */ mkPreset({
    more: "dots-vertical",
  }),
  heroicons: /* @__PURE__ */ mkPreset({
    close: "x-mark",
    loading: "arrow-path",
    upload: "arrow-up-tray",
    file: "document",
  }),
} as const;

export type PresetCollectionName = keyof typeof ICON_COLLECTION_PRESETS;

export type ResolvedIcons = Record<DefaultIconName, string> &
  Record<string, string>;

function isPresetCollection(col: string): col is PresetCollectionName {
  return Object.prototype.hasOwnProperty.call(ICON_COLLECTION_PRESETS, col);
}

export function getActiveCollections(iconsConfig?: IconsConfig): string[] {
  const cfg = iconsConfig ?? readIconsConfig();
  const raw = cfg.collections;

  const normalized = Array.isArray(raw) ? raw : [raw];
  const uniqueCollections = Array.from(
    new Set(
      normalized.filter((c): c is string =>
        Boolean(c && typeof c === "string"),
      ),
    ),
  );

  return uniqueCollections.length > 0 ? uniqueCollections : ["lucide"];
}

/**
 * Returns the active icon map (built-in defaults merged with `config.icons`).
 */
export function getIcons(): ResolvedIcons {
  const iconsConfig = readIconsConfig();
  const prefix = getPrefix(iconsConfig);
  const collections = getActiveCollections(iconsConfig);
  const primary = collections[0] as string;

  const result: Record<string, string> = {};

  const primaryPreset = isPresetCollection(primary)
    ? ICON_COLLECTION_PRESETS[primary]
    : ICON_COLLECTION_PRESETS.lucide;

  for (const key of ICON_KEYS) {
    const iconName = primaryPreset[key];
    result[key] = `${prefix}-${primary}-${iconName}`;
  }

  // Register namespaced presets (e.g., "tabler:close" -> "i-tabler-x")
  for (const col of collections) {
    if (!isPresetCollection(col)) continue;

    const preset = ICON_COLLECTION_PRESETS[col];
    for (const key of ICON_KEYS) {
      result[`${col}:${key}`] = `${prefix}-${col}-${preset[key]}`;
    }
  }

  // Merge user-defined icon overrides
  for (const [key, val] of Object.entries(iconsConfig)) {
    if (CONFIG_RESERVED_KEYS.has(key)) continue;
    if (val && typeof val === "string") {
      result[key] = val;
    }
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

  // Gracefully handle kebab-case alias lookups (e.g. "chevron-right" -> "chevronRight")
  if (name.includes("-")) {
    const camel = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (camel in icons) {
      return icons[camel] ?? "";
    }
  }

  const colonIdx = name.indexOf(":");
  if (colonIdx > 0) {
    const col = name.slice(0, colonIdx);
    const icon = name.slice(colonIdx + 1);

    if (icon) {
      const prefix = getPrefix(readIconsConfig());
      return `${prefix}-${col}-${icon}`;
    }
  }

  return "";
}
