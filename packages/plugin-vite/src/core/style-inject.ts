import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { getActiveCollections } from "@code-ui/core";
import { THEME_TAG } from "./theme";
import type { PluginConfigManager } from "./config";

const require = createRequire(import.meta.url);

interface ResolvedPackageScanTarget {
  compScanDir: string | undefined;
  compGlobPattern: string;
}

const packageScanCache = new Map<string, ResolvedPackageScanTarget>();

function resolveComponentScanTarget(
  projectRoot: string,
  styleDir: string,
): ResolvedPackageScanTarget {
  const cacheKey = `${projectRoot}\0${styleDir}`;
  const cached = packageScanCache.get(cacheKey);
  if (cached) return cached;

  let compScanDir: string | undefined;
  let compGlobPattern = "**/*.{ts,js,wxml}";

  try {
    const compPkg = require.resolve("@code-ui/components/package.json", {
      paths: [projectRoot, styleDir],
    });
    const compRoot = path.dirname(compPkg);
    const distRuntime = path.join(compRoot, "dist", "runtime");
    const srcRuntime = path.join(compRoot, "src", "runtime");

    if (fs.existsSync(distRuntime)) {
      compScanDir = distRuntime;
      compGlobPattern = "**/*.{js,wxml}";
    } else if (fs.existsSync(srcRuntime)) {
      compScanDir = srcRuntime;
      compGlobPattern = "**/*.{ts,js,wxml}";
    } else {
      compScanDir = compRoot;
    }
  } catch {
    // @code-ui/components not installed
  }

  const resolved: ResolvedPackageScanTarget = {
    compScanDir,
    compGlobPattern,
  };
  packageScanCache.set(cacheKey, resolved);
  return resolved;
}

function isTailwindIconsInstalled(
  projectRoot: string,
  styleDir: string,
): boolean {
  try {
    require.resolve("@egoist/tailwindcss-icons", {
      paths: [projectRoot, styleDir],
    });
    return true;
  } catch {
    return false;
  }
}

function checkIconCollectionInstalled(
  collection: string,
  projectRoot: string,
  styleDir: string,
): boolean {
  try {
    require.resolve(`@iconify-json/${collection}`, {
      paths: [projectRoot, styleDir],
    });
    return true;
  } catch {
    try {
      require.resolve("@iconify/json", {
        paths: [projectRoot, styleDir],
      });
      return true;
    } catch {
      return false;
    }
  }
}

function resolveIconsPluginDirective(
  code: string,
  projectRoot: string,
  styleDir: string,
  configManager: PluginConfigManager,
): string {
  if (
    code.includes('@plugin "@egoist/tailwindcss-icons"') ||
    code.includes("@plugin '@egoist/tailwindcss-icons'")
  ) {
    return "";
  }

  const iconsOptions = configManager.getIconsPluginOptions();
  if (!iconsOptions) return "";

  const autoPlugin = iconsOptions.autoPlugin ?? "auto";
  if (autoPlugin === false) return "";

  const collections = getActiveCollections(configManager.resolvedConfig.icons);
  const isInstalled = isTailwindIconsInstalled(projectRoot, styleDir);

  if (autoPlugin === "auto" && !isInstalled) {
    if (collections.length > 0) {
      console.warn(
        `\n[code-ui] ⚠️ Icon collection(s) "${collections.join(", ")}" configured, but "@egoist/tailwindcss-icons" is not installed.\nPlease install it via:\n  pnpm add -D @egoist/tailwindcss-icons\n`,
      );
    }
    return "";
  }

  for (const col of collections) {
    if (!checkIconCollectionInstalled(col, projectRoot, styleDir)) {
      console.warn(
        `\n[code-ui] ⚠️ Icon collection "${col}" is configured in cui.config.ts, but "@iconify-json/${col}" was not found.\nPlease install it via:\n  pnpm add -D @iconify-json/${col}\n`,
      );
    }
  }

  const hasCustomOptions =
    iconsOptions.scale !== undefined ||
    iconsOptions.prefix !== undefined ||
    (iconsOptions.extraProperties &&
      Object.keys(iconsOptions.extraProperties).length > 0);

  if (!hasCustomOptions) {
    return `\n@plugin "@egoist/tailwindcss-icons";\n`;
  }

  const lines: string[] = [];
  if (iconsOptions.scale !== undefined) {
    lines.push(`  scale: ${iconsOptions.scale};`);
  }
  if (iconsOptions.prefix !== undefined) {
    lines.push(`  prefix: "${iconsOptions.prefix}";`);
  }
  if (iconsOptions.extraProperties) {
    for (const [k, v] of Object.entries(iconsOptions.extraProperties)) {
      lines.push(`  ${k}: ${v};`);
    }
  }

  return `\n@plugin "@egoist/tailwindcss-icons" {\n${lines.join("\n")}\n};\n`;
}

export function transformAppStyle(
  code: string,
  cleanId: string,
  projectRoot: string,
  configManager: PluginConfigManager,
  addWatchFile: (id: string) => void,
): { code: string; map: null } | null {
  const styleDir = path.dirname(cleanId);
  let injection = "";

  if (configManager.configPath) {
    addWatchFile(configManager.configPath);
    const relConfig = path
      .relative(styleDir, configManager.configPath)
      .replace(/\\/g, "/");
    const sourcePath = relConfig.startsWith(".") ? relConfig : `./${relConfig}`;
    if (!code.includes(sourcePath)) {
      injection += `\n@source "${sourcePath}";\n`;
    }
  }

  if (!code.includes(".wxml") && !code.includes(".ts")) {
    injection += `\n@source "./**/*.{ts,js,wxml}";\n`;
  }

  const { compScanDir, compGlobPattern } = resolveComponentScanTarget(
    projectRoot,
    styleDir,
  );

  if (compScanDir) {
    const relComp = path.relative(styleDir, compScanDir).replace(/\\/g, "/");
    const compSource = `${relComp.startsWith(".") ? relComp : `./${relComp}`}/${compGlobPattern}`;
    if (!code.includes(relComp)) {
      injection += `\n@source "${compSource}";\n`;
    }
  }

  const iconsDirective = resolveIconsPluginDirective(
    code,
    projectRoot,
    styleDir,
    configManager,
  );
  if (iconsDirective) {
    injection += iconsDirective;
  }

  // All @code-ui/core theme definitions (plus user color & component overrides)
  // are already compiled in memory and emitted via @source inline(...) below.
  injection += configManager.getInlineThemeClassesDirective();

  if (!code.includes(THEME_TAG)) {
    const themeCSS = configManager.getThemeCSS();
    if (themeCSS) {
      injection += `\n${themeCSS}\n`;
    }
  }

  if (injection) {
    return {
      code: `${code}\n${injection}`,
      map: null,
    };
  }

  return null;
}
