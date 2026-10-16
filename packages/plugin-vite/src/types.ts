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
