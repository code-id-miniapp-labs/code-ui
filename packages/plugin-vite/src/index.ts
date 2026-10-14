import type { Plugin, ViteDevServer } from "vite";
import { loadConfig } from "c12";
import { componentThemes, type CodeUIConfig } from "@code-ui/core";
import path from "node:path";
import { createRequire } from "node:module";
import {
  transformAutoImport,
  generateBundleAutoImport,
} from "./core/auto-import";
import { handleTreeShake } from "./core/tree-shake";

const require = createRequire(import.meta.url);

export { defineConfig } from "@code-ui/core";
export type { CodeUIConfig, ComponentConfig } from "@code-ui/core";

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

/** App stylesheet entry (relative to project root), e.g. `src/app.scss`. */
const APP_STYLE_RE = /^(?:src\/)?app\.(?:scss|sass|less|css|wxss)$/;

const VIRTUAL_MODULE_ID = "virtual:cui/config";
const RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID;

const VIRTUAL_MODULE_SHORT = "virtual:cui-config";
const RESOLVED_VIRTUAL_MODULE_SHORT = "\0" + VIRTUAL_MODULE_SHORT;

import { generateThemeCSS, THEME_TAG } from "./core/theme";
import {
  compileComponentTheme,
  extractClassesFromThemeConfig,
  mergeConfig,
  serializeConfig,
} from "./core/utils";
export { generateThemeCSS, TAILWIND_PALETTES, SHADES } from "./core/theme";
export {
  compileComponentTheme,
  extractClassesFromThemeConfig,
  mergeConfig,
  serializeConfig,
} from "./core/utils";

export function codeUI(options: CodeUIVitePluginOptions = {}): Plugin {
  let resolvedConfig: CodeUIConfig = mergeConfig(
    { prefix: "cui" },
    { ui: options.ui, components: options.components },
  );
  let configPath: string | null = null;
  let server: ViteDevServer | null = null;
  let viteConfigObj: any = null;

  const autoInject = options.autoInject !== false;
  const autoSource = options.autoSource !== false;

  const autoImportOpts: AutoImportOptions =
    typeof options.autoImport === "boolean"
      ? { enable: options.autoImport }
      : options.autoImport || { enable: false };

  const treeShakeOpts: TreeShakeOptions =
    typeof options.treeShake === "boolean"
      ? { enable: options.treeShake }
      : options.treeShake || { enable: false };

  let projectRoot = process.cwd();

  async function reloadConfig(root: string) {
    try {
      const { config, configFile } = await loadConfig<CodeUIConfig>({
        name: "cui",
        configFile: options.configFile || "cui.config",
        cwd: options.cwd || root,
        rcFile: false,
      });

      if (config) {
        resolvedConfig = mergeConfig(config, {
          ui: options.ui,
          components: options.components,
        });
      } else {
        resolvedConfig = mergeConfig(
          { prefix: "cui" },
          { ui: options.ui, components: options.components },
        );
      }
      if (configFile) {
        configPath = configFile;
      }
    } catch (err) {
      console.warn("[code-ui] Failed to load cui.config.ts:", err);
      resolvedConfig = mergeConfig(
        { prefix: "cui" },
        { ui: options.ui, components: options.components },
      );
    }
  }

  return {
    name: "code-ui:vite",
    enforce: "pre",

    async configResolved(viteConfig) {
      projectRoot = viteConfig.root;
      viteConfigObj = viteConfig;

      await reloadConfig(viteConfig.root);
    },

    configureServer(devServer) {
      server = devServer;

      if (configPath) {
        devServer.watcher.add(configPath);
        devServer.watcher.on("change", async (changedPath) => {
          if (
            configPath &&
            path.resolve(changedPath) === path.resolve(configPath)
          ) {
            await reloadConfig(devServer.config.root);
            const mod1 = server?.moduleGraph.getModuleById(
              RESOLVED_VIRTUAL_MODULE_ID,
            );
            const mod2 = server?.moduleGraph.getModuleById(
              RESOLVED_VIRTUAL_MODULE_SHORT,
            );
            const modTheme = server?.moduleGraph.getModuleById(
              "\0virtual:cui/theme",
            );
            if (mod1) server?.moduleGraph.invalidateModule(mod1);
            if (mod2) server?.moduleGraph.invalidateModule(mod2);
            if (modTheme) server?.moduleGraph.invalidateModule(modTheme);

            if (server?.moduleGraph?.idToModuleMap) {
              for (const [modId, mod] of server.moduleGraph.idToModuleMap) {
                if (modId && modId.startsWith("\0virtual:cui/theme/")) {
                  server.moduleGraph.invalidateModule(mod);
                } else if (
                  mod.id &&
                  APP_STYLE_RE.test(
                    path
                      .relative(projectRoot, mod.id.split("?")[0]!)
                      .replace(/\\/g, "/"),
                  )
                ) {
                  server.moduleGraph.invalidateModule(mod);
                }
              }
            }

            server?.ws.send({
              type: "full-reload",
            });
          }
        });
      }
    },

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID;
      }
      if (id === VIRTUAL_MODULE_SHORT) {
        return RESOLVED_VIRTUAL_MODULE_SHORT;
      }
      if (id === "virtual:cui/theme") {
        return "\0virtual:cui/theme";
      }
      if (id.startsWith("virtual:cui/theme/")) {
        return "\0" + id;
      }
      return null;
    },

    async watchChange(id) {
      if (configPath && path.resolve(id) === path.resolve(configPath)) {
        await reloadConfig(projectRoot);
      }
    },

    load(id) {
      if (
        id === RESOLVED_VIRTUAL_MODULE_ID ||
        id === RESOLVED_VIRTUAL_MODULE_SHORT
      ) {
        if (configPath) this.addWatchFile(configPath);
        return `
const config = ${serializeConfig(resolvedConfig)};
const g = typeof globalThis !== "undefined"
  ? globalThis
  : typeof window !== "undefined"
    ? window
    : typeof global !== "undefined"
      ? global
      : {};

g.__CODE_UI_GLOBAL_CONFIG__ = Object.assign(g.__CODE_UI_GLOBAL_CONFIG__ || {}, config);

export default config;

if (import.meta.hot) {
  import.meta.hot.accept();
}
`;
      }

      if (id.startsWith("\0virtual:cui/theme/")) {
        if (configPath) this.addWatchFile(configPath);
        const componentName = id.replace("\0virtual:cui/theme/", "");
        const factory = (componentThemes as Record<string, any>)[componentName];
        if (!factory) {
          throw new Error(
            `[code-ui] Unknown component theme: "${componentName}". Available themes: ${Object.keys(componentThemes).join(", ")}`,
          );
        }
        const themeConfig = compileComponentTheme(
          componentName,
          factory,
          resolvedConfig,
        );
        return `export default ${serializeConfig(themeConfig)};`;
      }

      if (id === "\0virtual:cui/theme") {
        if (configPath) this.addWatchFile(configPath);
        const allThemes: Record<string, any> = {};
        for (const [name, factory] of Object.entries(componentThemes)) {
          allThemes[name] = compileComponentTheme(
            name,
            factory,
            resolvedConfig,
          );
        }
        return `export default ${serializeConfig(allThemes)};`;
      }

      return null;
    },

    transform(code, id) {
      const cleanId = id.split("?")[0];
      if (!cleanId) return null;

      const isRawOrUrl = /[?&](?:raw|url|worker)\b/.test(id);

      if (
        autoSource &&
        !isRawOrUrl &&
        !cleanId.includes("node_modules") &&
        !code.trimStart().startsWith("export ")
      ) {
        const relStyle = path
          .relative(projectRoot, cleanId)
          .replace(/\\/g, "/");
        if (APP_STYLE_RE.test(relStyle)) {
          let injection = "";
          if (configPath) {
            this.addWatchFile(configPath);
            const relConfig = path
              .relative(path.dirname(cleanId), configPath)
              .replace(/\\/g, "/");
            const sourcePath = relConfig.startsWith(".")
              ? relConfig
              : `./${relConfig}`;
            if (!code.includes(sourcePath)) {
              injection += `\n@source "${sourcePath}";\n`;
            }
          }
          if (!code.includes(".wxml")) {
            injection += `\n@source "./**/*.wxml";\n`;
          }

          // Scan @code-ui/components and @code-ui/core for Tailwind utility extraction
          let compDir: string | undefined;
          try {
            const compPkg = require.resolve(
              "@code-ui/components/package.json",
              {
                paths: [projectRoot, path.dirname(cleanId)],
              },
            );
            compDir = path.dirname(compPkg);
            const relComp = path
              .relative(path.dirname(cleanId), compDir)
              .replace(/\\/g, "/");
            const compSource = `${relComp.startsWith(".") ? relComp : `./${relComp}`}/**/*.{ts,js,wxml}`;
            if (!code.includes(relComp)) {
              injection += `\n@source "${compSource}";\n`;
            }
          } catch {}

          try {
            const corePkg = require.resolve("@code-ui/core/package.json", {
              paths: [compDir, projectRoot, path.dirname(cleanId)].filter(
                (p): p is string => Boolean(p),
              ),
            });
            const coreDir = path.dirname(corePkg);
            const relCore = path
              .relative(path.dirname(cleanId), coreDir)
              .replace(/\\/g, "/");
            const coreSource = `${relCore.startsWith(".") ? relCore : `./${relCore}`}/**/*.{ts,js}`;
            if (!code.includes(relCore)) {
              injection += `\n@source "${coreSource}";\n`;
            }
          } catch {
            try {
              const coreEntry = require.resolve("@code-ui/core", {
                paths: [projectRoot, path.dirname(cleanId)],
              });
              const coreDir = path.resolve(path.dirname(coreEntry), "..");
              const relCore = path
                .relative(path.dirname(cleanId), coreDir)
                .replace(/\\/g, "/");
              const coreSource = `${relCore.startsWith(".") ? relCore : `./${relCore}`}/**/*.{ts,js}`;
              if (!code.includes(relCore)) {
                injection += `\n@source "${coreSource}";\n`;
              }
            } catch {}
          }

          const allThemeClasses = new Set<string>();
          for (const [name, factory] of Object.entries(componentThemes)) {
            const themeConfig = compileComponentTheme(
              name,
              factory,
              resolvedConfig,
            );
            for (const c of extractClassesFromThemeConfig(themeConfig)) {
              allThemeClasses.add(c);
            }
          }
          if (allThemeClasses.size > 0) {
            const inlineClasses = Array.from(allThemeClasses)
              .join(" ")
              .replace(/\\/g, "\\\\")
              .replace(/"/g, '\\"');
            injection += `\n@source inline("${inlineClasses}");\n`;
          }
          if (!code.includes(THEME_TAG)) {
            const themeCSS = generateThemeCSS(resolvedConfig.ui);
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
        }
      }

      if (autoInject) {
        const relPath = path.relative(projectRoot, cleanId).replace(/\\/g, "/");
        const isAppEntry =
          /^(?:src\/)?app\.(?:ts|js|tsx|jsx)$/.test(relPath) &&
          !cleanId.includes("node_modules");

        if (
          isAppEntry &&
          !code.includes(VIRTUAL_MODULE_ID) &&
          !code.includes(VIRTUAL_MODULE_SHORT)
        ) {
          return {
            code: `import "${VIRTUAL_MODULE_ID}";\n` + code,
            map: null,
          };
        }
      }

      const autoImportResult = transformAutoImport(code, id, autoImportOpts);
      if (autoImportResult && cleanId.endsWith(".json")) {
        const wxmlPath = cleanId.replace(/\.json$/, ".wxml");
        this.addWatchFile(wxmlPath);
      }
      return autoImportResult;
    },

    generateBundle(_options, bundle) {
      generateBundleAutoImport(bundle, autoImportOpts, projectRoot);
      handleTreeShake(treeShakeOpts, projectRoot, viteConfigObj, bundle);
    },

    async writeBundle() {
      // Tree-shaking is now handled in generateBundle to support dev mode HMR
      // where writeBundle is not called.
    },
  };
}

export default codeUI;
