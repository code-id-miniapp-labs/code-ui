import { getConfig, type IconsConfig } from "./config";

/**
 * Built-in icon mappings for popular Iconify collections.
 */
export const ICON_COLLECTION_PRESETS = {
  lucide: {
    check: "check",
    minus: "minus",
    close: "x",
    loading: "loader",
    chevronDown: "chevron-down",
  },
  tabler: {
    check: "check",
    minus: "minus",
    close: "x",
    loading: "loader-2",
    chevronDown: "chevron-down",
  },
  mdi: {
    check: "check",
    minus: "minus",
    close: "close",
    loading: "loading",
    chevronDown: "chevron-down",
  },
  heroicons: {
    check: "check",
    minus: "minus",
    close: "x-mark",
    loading: "arrow-path",
    chevronDown: "chevron-down",
  },
} as const;

export type DefaultIconName = keyof (typeof ICON_COLLECTION_PRESETS)["lucide"];

export type ResolvedIcons = Record<DefaultIconName, string> &
  Record<string, string>;

/**
 * Resolves all active icon collection names from configuration.
 * Always ensures at least one collection (defaults to "lucide").
 * The first item in the returned array is the primary collection.
 */
export function getActiveCollections(iconsConfig?: IconsConfig): string[] {
  const cfg = iconsConfig ?? getConfig()?.icons ?? {};
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
  const iconsConfig: IconsConfig = getConfig()?.icons ?? {};
  const prefix =
    typeof iconsConfig.prefix === "string" ? iconsConfig.prefix : "i";
  const collections = getActiveCollections(iconsConfig);
  const primaryCollection = collections[0] || "lucide";

  let baseIcons: Record<string, string> = {};

  if (primaryCollection in ICON_COLLECTION_PRESETS) {
    const preset =
      ICON_COLLECTION_PRESETS[
        primaryCollection as keyof typeof ICON_COLLECTION_PRESETS
      ];
    baseIcons = {
      check: `${prefix}-${primaryCollection}-${preset.check}`,
      minus: `${prefix}-${primaryCollection}-${preset.minus}`,
      close: `${prefix}-${primaryCollection}-${preset.close}`,
      loading: `${prefix}-${primaryCollection}-${preset.loading}`,
      chevronDown: `${prefix}-${primaryCollection}-${preset.chevronDown}`,
    };
  } else {
    baseIcons = {
      check: `${prefix}-${primaryCollection}-check`,
      minus: `${prefix}-${primaryCollection}-minus`,
      close: `${prefix}-${primaryCollection}-close`,
      loading: `${prefix}-${primaryCollection}-loading`,
      chevronDown: `${prefix}-${primaryCollection}-chevron-down`,
    };
  }

  // Register namespaced presets for all active collections
  for (const col of collections) {
    if (col in ICON_COLLECTION_PRESETS) {
      const preset =
        ICON_COLLECTION_PRESETS[col as keyof typeof ICON_COLLECTION_PRESETS];
      baseIcons[`${col}:check`] = `${prefix}-${col}-${preset.check}`;
      baseIcons[`${col}:minus`] = `${prefix}-${col}-${preset.minus}`;
      baseIcons[`${col}:close`] = `${prefix}-${col}-${preset.close}`;
      baseIcons[`${col}:loading`] = `${prefix}-${col}-${preset.loading}`;
      baseIcons[`${col}:chevronDown`] = `${prefix}-${col}-${preset.chevronDown}`;
    }
  }

  const result: Record<string, string> = { ...baseIcons };
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
      const iconsConfig: IconsConfig = getConfig()?.icons ?? {};
      const prefix =
        typeof iconsConfig.prefix === "string" ? iconsConfig.prefix : "i";
      return `${prefix}-${col}-${icon}`;
    }
  }
  return "";
}
