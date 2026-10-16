import path from "node:path";
import type { Plugin, ResolvedConfig, ViteDevServer } from "vite";
import {
  APP_ENTRY_RE,
  APP_SCRIPT_SUFFIX_RE,
  APP_STYLE_RE,
  RAW_OR_URL_RE,
  RESOLVED_VIRTUAL_MODULE_ID,
  RESOLVED_VIRTUAL_MODULE_SHORT,
  RESOLVED_VIRTUAL_THEME_ID,
  RESOLVED_VIRTUAL_THEME_PREFIX,
  STYLE_EXT_RE,
  VIRTUAL_MODULE_ID,
  VIRTUAL_MODULE_SHORT,
  VIRTUAL_THEME_ID,
  VIRTUAL_THEME_PREFIX,
} from "./constants";
import {
  generateBundleAutoImport,
  invalidateWxmlTagCache,
  syncDiskAutoImport,
  transformAutoImport,
} from "./core/auto-import";
import {
  PluginConfigManager,
  resolveAutoImportOptions,
  resolveTreeShakeOptions,
} from "./core/config";
import { cleanKeyframes, cleanKeyframesInDir } from "./core/keyframes";
import { transformAppStyle } from "./core/style-inject";
import { handleTreeShake } from "./core/tree-shake";
import {
  isBundleAsset,
  type AutoImportOptions,
  type CodeUIVitePluginOptions,
  type OutputBundleLike,
  type TreeShakeOptions,
} from "./types";

export { defineConfig } from "@code-ui/core";
export type { CodeUIConfig, ComponentConfig } from "@code-ui/core";
export type { AutoImportOptions, CodeUIVitePluginOptions, TreeShakeOptions };

export { generateThemeCSS, SHADES, TAILWIND_PALETTES } from "./core/theme";
export {
  cleanKeyframes,
  compileComponentTheme,
  extractClassesFromThemeConfig,
  mergeConfig,
  serializeConfig,
} from "./core/utils";

function invalidateVirtualModules(
  server: ViteDevServer,
  projectRoot: string,
): void {
  const { moduleGraph } = server;
  const staticIds = [
    RESOLVED_VIRTUAL_MODULE_ID,
    RESOLVED_VIRTUAL_MODULE_SHORT,
    RESOLVED_VIRTUAL_THEME_ID,
  ];

  for (const id of staticIds) {
    const mod = moduleGraph.getModuleById(id);
    if (mod) moduleGraph.invalidateModule(mod);
  }

  if (!moduleGraph.idToModuleMap) return;

  for (const [modId, mod] of moduleGraph.idToModuleMap) {
    if (modId && modId.startsWith(RESOLVED_VIRTUAL_THEME_PREFIX)) {
      moduleGraph.invalidateModule(mod);
    } else if (mod.id) {
      const qIdx = mod.id.indexOf("?");
      const cleanModId = qIdx === -1 ? mod.id : mod.id.slice(0, qIdx);
      if (
        STYLE_EXT_RE.test(cleanModId) &&
        APP_STYLE_RE.test(
          path.relative(projectRoot, cleanModId).replace(/\\/g, "/"),
        )
      ) {
        moduleGraph.invalidateModule(mod);
      }
    }
  }
}

export function codeUI(options: CodeUIVitePluginOptions = {}): Plugin {
  const configManager = new PluginConfigManager(options);
  const autoInject = options.autoInject !== false;
  const autoSource = options.autoSource !== false;
  const autoImportOpts = resolveAutoImportOptions(options.autoImport);
  const treeShakeOpts = resolveTreeShakeOptions(options.treeShake);

  let server: ViteDevServer | null = null;
  let viteConfigObj: ResolvedConfig | null = null;
  let projectRoot = process.cwd();
  const cleanedBundleCssPaths = new Set<string>();

  return {
    name: "code-ui:vite",
    enforce: "pre",

    async configResolved(viteConfig) {
      projectRoot = viteConfig.root;
      viteConfigObj = viteConfig;
      await configManager.reload(viteConfig.root);
    },

    configureServer(devServer) {
      server = devServer;

      if (configManager.configPath) {
        const resolvedConfigPath = path.resolve(configManager.configPath);
        devServer.watcher.add(configManager.configPath);
        devServer.watcher.on("change", async (changedPath) => {
          if (path.resolve(changedPath) === resolvedConfigPath) {
            await configManager.reload(devServer.config.root);
            if (server) {
              invalidateVirtualModules(server, projectRoot);
              server.ws.send({ type: "full-reload" });
            }
          }
        });
      }
    },

    resolveId(id) {
      if (!id.startsWith("virtual:cui")) return null;
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID;
      if (id === VIRTUAL_MODULE_SHORT) return RESOLVED_VIRTUAL_MODULE_SHORT;
      if (id === VIRTUAL_THEME_ID) return RESOLVED_VIRTUAL_THEME_ID;
      if (id.startsWith(VIRTUAL_THEME_PREFIX)) return "\0" + id;
      return null;
    },

    async watchChange(id) {
      if (id.endsWith(".wxml")) {
        invalidateWxmlTagCache(id);
      }
      if (
        configManager.configPath &&
        path.resolve(id) === path.resolve(configManager.configPath)
      ) {
        await configManager.reload(projectRoot);
      }
    },

    load(id) {
      if (!id.startsWith("\0virtual:cui")) return null;

      if (
        id === RESOLVED_VIRTUAL_MODULE_ID ||
        id === RESOLVED_VIRTUAL_MODULE_SHORT
      ) {
        if (configManager.configPath) {
          this?.addWatchFile?.(configManager.configPath);
        }
        return configManager.getVirtualConfigCode();
      }

      if (id.startsWith(RESOLVED_VIRTUAL_THEME_PREFIX)) {
        if (configManager.configPath) {
          this?.addWatchFile?.(configManager.configPath);
        }
        const componentName = id.slice(RESOLVED_VIRTUAL_THEME_PREFIX.length);
        return configManager.getVirtualComponentThemeCode(componentName);
      }

      if (id === RESOLVED_VIRTUAL_THEME_ID) {
        if (configManager.configPath) {
          this?.addWatchFile?.(configManager.configPath);
        }
        return configManager.getVirtualAllThemesCode();
      }

      return null;
    },

    transform(code, id) {
      if (id.startsWith("\0")) return null;

      const qIdx = id.indexOf("?");
      const cleanId = qIdx === -1 ? id : id.slice(0, qIdx);
      if (!cleanId) return null;

      // 1. JSON usingComponents auto-import
      if (cleanId.endsWith(".json")) {
        if (!autoImportOpts.enable) return null;
        const autoImportResult = transformAutoImport(code, id, autoImportOpts);
        if (autoImportResult) {
          const wxmlPath = cleanId.slice(0, -5) + ".wxml";
          this?.addWatchFile?.(wxmlPath);
        }
        return autoImportResult;
      }

      if (cleanId.includes("node_modules")) return null;

      // 2. App stylesheet @source & @theme CSS injection
      if (
        autoSource &&
        STYLE_EXT_RE.test(cleanId) &&
        (qIdx === -1 || !RAW_OR_URL_RE.test(id)) &&
        !code.trimStart().startsWith("export ")
      ) {
        const relStyle = path
          .relative(projectRoot, cleanId)
          .replace(/\\/g, "/");
        if (APP_STYLE_RE.test(relStyle)) {
          return transformAppStyle(
            code,
            cleanId,
            projectRoot,
            configManager,
            (watchFile) => this?.addWatchFile?.(watchFile),
          );
        }
      }

      // 3. App script entry virtual:cui/config auto-injection
      if (autoInject && APP_SCRIPT_SUFFIX_RE.test(cleanId)) {
        const relPath = path.relative(projectRoot, cleanId).replace(/\\/g, "/");
        if (
          APP_ENTRY_RE.test(relPath) &&
          !code.includes(VIRTUAL_MODULE_ID) &&
          !code.includes(VIRTUAL_MODULE_SHORT)
        ) {
          return {
            code: `import "${VIRTUAL_MODULE_ID}";\n` + code,
            map: null,
          };
        }
      }

      return null;
    },

    generateBundle: {
      order: "post",
      handler(_options, bundle) {
        cleanedBundleCssPaths.clear();
        const outDir = viteConfigObj?.build?.outDir || "dist";
        const distRoot = path.resolve(projectRoot, outDir);
        const typedBundle = bundle as unknown as OutputBundleLike;

        const updatedInBundle = generateBundleAutoImport(
          typedBundle,
          autoImportOpts,
          projectRoot,
        );
        syncDiskAutoImport(
          distRoot,
          autoImportOpts,
          projectRoot,
          updatedInBundle,
        );
        handleTreeShake(treeShakeOpts, projectRoot, viteConfigObj, typedBundle);

        for (const [fileName, item] of Object.entries(typedBundle)) {
          if (
            (fileName.endsWith(".wxss") || fileName.endsWith(".css")) &&
            isBundleAsset(item) &&
            typeof item.source === "string"
          ) {
            item.source = cleanKeyframes(item.source);
            cleanedBundleCssPaths.add(path.resolve(distRoot, fileName));
          }
        }
      },
    },

    closeBundle() {
      const outDir = viteConfigObj?.build?.outDir || "dist";
      const distRoot = path.resolve(projectRoot, outDir);
      syncDiskAutoImport(distRoot, autoImportOpts, projectRoot);
      handleTreeShake(treeShakeOpts, projectRoot, viteConfigObj);
      cleanKeyframesInDir(distRoot, cleanedBundleCssPaths);
      cleanedBundleCssPaths.clear();
    },
  };
}

export default codeUI;
