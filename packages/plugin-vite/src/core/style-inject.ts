import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
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

  if (!code.includes(".wxml")) {
    injection += `\n@source "./**/*.wxml";\n`;
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
