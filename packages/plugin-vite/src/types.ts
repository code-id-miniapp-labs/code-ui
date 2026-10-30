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

export interface AppWrapperOptions {
  /**
   * Whether to enable automatic <c-app> page wrapping.
   * Default: true
   */
  enable?: boolean;
  /**
   * Component tag name to wrap page content with.
   * Default: `${prefix}-app` (e.g. "c-app")
   */
  tag?: string;
  /**
   * Whether to auto-inject <page-meta page-style="{{ cuiPageStyle }}" />
   * Default: false
   */
  pageMeta?: boolean;
  /**
   * Default props to attach to the root app wrapper tag.
   * Example: { "safe-area": "both", "className": "min-h-screen bg-neutral-50" }
   */
  defaultProps?: Record<string, string | boolean | number>;
  /**
   * Relative page paths, regexes, or globs to exclude from auto-wrapping.
   */
  exclude?: (string | RegExp)[];
  /**
   * Relative page paths, regexes, or globs to explicitly include.
   */
  include?: (string | RegExp)[];
}

export interface ResolvedAppWrapperOptions {
  enable: boolean;
  tag: string;
  pageMeta: boolean;
  defaultProps?: Record<string, string | boolean | number> | undefined;
  exclude: (string | RegExp)[];
  include?: (string | RegExp)[] | undefined;
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
  /**
   * Auto-inject <c-app> wrapper into WeChat MiniProgram pages.
   * Default: true
   */
  appWrapper?: boolean | AppWrapperOptions;
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
