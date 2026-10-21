import type { CodeUIConfig } from "@code-ui/core";

export interface AutoImportOptions {
  enable?: boolean;
  prefix?: string;
  library?: string;
  componentDir?: string;
  componentSuffix?: string;
}

export interface TreeShakeOptions {
  enable?: boolean;
  library?: string;
}

export interface IconsPluginOptions {
  /**
   * Whether to auto-inject the Tailwind CSS v4 icon plugin directive into app.css.
   * - 'auto' (default): checks if @egoist/tailwindcss-icons is installed in node_modules, and injects if present.
   * - true: always inject.
   * - false: never inject.
   */
  autoPlugin?: boolean | "auto";
  /**
   * Prefix for icon classes. Default: "i"
   */
  prefix?: string;
  /**
   * Scale relative to current font size. Default: 1
   */
  scale?: number;
  /**
   * List of icon collection names to support.
   */
  collections?: string[];
  /**
   * Extra CSS properties or plugin options passed to the icon plugin.
   */
  extraProperties?: Record<string, string>;
}

export interface CodeUIVitePluginOptions {
  cwd?: string;
  configFile?: string;
  autoInject?: boolean;
  /**
   * Append `@source "<cui.config path>"` to the app stylesheet so Tailwind
   * generates CSS for classes written in cui.config.ts. Default: true.
   */
  autoSource?: boolean;
  autoImport?: boolean | AutoImportOptions;
  treeShake?: boolean | TreeShakeOptions;
  icons?: CodeUIConfig["icons"] | boolean | IconsPluginOptions;
  ui?: CodeUIConfig["ui"];
  components?: CodeUIConfig["components"];
}

export interface ResolvedAutoImportOptions {
  enable: boolean;
  prefix: string;
  library: string;
  dirPrefix: string;
  suffix: string;
  tagRegex: RegExp;
  prefixRegex: RegExp;
}

export interface ResolvedTreeShakeOptions {
  enable: boolean;
  library: string;
}

export interface BundleAssetLike {
  type: "asset";
  fileName?: string;
  source: string | Uint8Array;
}

export type OutputBundleLike = Record<
  string,
  { type: string; source?: string | Uint8Array; [key: string]: unknown }
>;

export function isBundleAsset(item: unknown): item is BundleAssetLike {
  return (
    Boolean(item) &&
    typeof item === "object" &&
    (item as { type?: unknown }).type === "asset"
  );
}
