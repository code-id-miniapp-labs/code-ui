import fs from "node:fs";
import path from "node:path";
import {
  DEFAULT_THEME_COLORS,
  componentThemes,
  type CodeUIConfig,
} from "@code-id-labs/core";
import { serializeCompactThemeModule } from "@code-id-labs/compiler";
import type { PluginConfigManager } from "./config";
import { applyColorSystemToTheme, isPlainObject } from "./theme";
import type { ResolvedTreeShakeOptions, TreeShakeOptions } from "../types";

const OVERRIDE_KEYS = new Set([
  "base",
  "slots",
  "ui",
  "variants",
  "compoundVariants",
  "defaultVariants",
  "defaultProps",
]);

function isComponentOverrideObject(val: unknown): val is Record<string, any> {
  if (!isPlainObject(val)) return false;
  for (const key of Object.keys(val)) {
    if (OVERRIDE_KEYS.has(key)) return true;
  }
  return false;
}

function lookupComponentOverride(
  map: Record<string, any> | undefined,
  componentName: string,
  camelName: string,
  kebabName: string,
  prefix: string,
): Record<string, any> | undefined {
  if (!isPlainObject(map)) return undefined;
  const direct = map[componentName] ?? map[camelName] ?? map[kebabName];
  if (isComponentOverrideObject(direct)) return direct;
  const prefixed =
    map[`${prefix}-${kebabName}`] ??
    map[`c-${kebabName}`] ??
    map[`cui-${kebabName}`];
  if (isComponentOverrideObject(prefixed)) return prefixed;
  return undefined;
}

/**
 * Builds the pre-merged CJS theme module for a single component so
 * `miniprogram_npm/<library>/runtime/<name>/theme.js` already contains:
 * - custom `ui.colors` / `ui.colorMode`
 * - `ui.<name>` and `components.<name>` overrides with identical runtime precedence
 * - `pm: 1` so `tv()` skips runtime `globalThis.__CODE_UI_GLOBAL_CONFIG__` lookups
 */
export function buildPremergedComponentThemeSource(
  componentName: string,
  resolvedConfig: CodeUIConfig,
): string | null {
  const camelName = componentName.replace(/-([a-z0-9])/g, (_, c: string) =>
    c.toUpperCase(),
  );
  const kebabName = componentName
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();

  const themesMap = componentThemes as Record<string, any>;
  const factory =
    themesMap[componentName] ?? themesMap[camelName] ?? themesMap[kebabName];
  if (!factory) return null;

  const userColors = resolvedConfig.ui?.colors
    ? Object.keys(resolvedConfig.ui.colors).filter((c) => c !== "neutral")
    : [];
  const allColors =
    userColors.length > 0
      ? Array.from(new Set([...DEFAULT_THEME_COLORS, ...userColors]))
      : DEFAULT_THEME_COLORS;

  const errorColor = resolvedConfig.ui?.colors?.error ? "error" : "danger";
  const colorMode = resolvedConfig.ui?.colorMode ?? "system";

  const rawTheme =
    typeof factory === "function"
      ? factory({ colors: allColors, errorColor, colorMode })
      : structuredClone(factory);
  const compiledBase = applyColorSystemToTheme(rawTheme, colorMode);

  const prefix =
    typeof resolvedConfig.prefix === "string" && resolvedConfig.prefix
      ? resolvedConfig.prefix
      : "cui";

  const uiOv = lookupComponentOverride(
    resolvedConfig.ui as Record<string, any> | undefined,
    componentName,
    camelName,
    kebabName,
    prefix,
  );
  const compOv = lookupComponentOverride(
    resolvedConfig.components as Record<string, any> | undefined,
    componentName,
    camelName,
    kebabName,
    prefix,
  );

  const overrides: Record<string, any>[] = [];
  if (uiOv) overrides.push(uiOv);
  if (compOv) overrides.push(compOv);

  const payload: Record<string, any> = {
    name: componentName,
    pm: 1,
    ...compiledBase,
    ...(overrides.length > 0 ? { overrides } : {}),
  };

  return serializeCompactThemeModule(payload, { format: "cjs" });
}

/**
 * Overwrites `dist/miniprogram_npm/<library>/runtime/<name>/theme.js` with
 * build-time pre-merged themes derived from `cui.config.ts`.
 *
 * Only writes files whose contents actually changed so dev-mode file watchers
 * (e.g. WeChat DevTools) do not reload unnecessarily.
 */
export function syncCompiledComponentThemes(
  configManager: PluginConfigManager,
  treeShakeOpts: TreeShakeOptions | ResolvedTreeShakeOptions,
  projectRoot: string,
  viteConfigObj: { build?: { outDir?: string } } | null | undefined,
): number {
  const treeLibrary = treeShakeOpts.library || "@code-id-labs/components";
  const outDir = viteConfigObj?.build?.outDir || "dist";
  const runtimeDir = path.resolve(
    projectRoot,
    outDir,
    "miniprogram_npm",
    treeLibrary,
    "runtime",
  );

  if (!fs.existsSync(runtimeDir)) return 0;

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(runtimeDir, { withFileTypes: true });
  } catch {
    return 0;
  }

  let updatedCount = 0;
  const resolvedConfig = configManager.resolvedConfig;

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith("_")) continue;
    const themeFilePath = path.join(runtimeDir, entry.name, "theme.js");
    if (!fs.existsSync(themeFilePath)) continue;

    const nextSource = buildPremergedComponentThemeSource(
      entry.name,
      resolvedConfig,
    );
    if (!nextSource) continue;

    try {
      const prevSource = fs.readFileSync(themeFilePath, "utf8");
      if (prevSource === nextSource) continue;
      fs.writeFileSync(themeFilePath, nextSource, "utf8");
      updatedCount++;
    } catch {
      // Ignore transient write errors during concurrent npm builds
    }
  }

  return updatedCount;
}
