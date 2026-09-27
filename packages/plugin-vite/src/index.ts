import type { Plugin, ViteDevServer } from "vite";
import { loadConfig } from "c12";
import type { CodeUIConfig } from "@code-ui/core";
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";

export { defineConfig } from "@code-ui/core";
export type { CodeUIConfig, ComponentConfig } from "@code-ui/core";

export interface AutoImportOptions {
  /**
   * Enable auto-importing components based on WXML tags.
   * Defaults to false.
   */
  enable?: boolean;
  /**
   * The tag prefix to watch for, e.g., "c" for `<c-button>`.
   * Defaults to "c".
   */
  prefix?: string;
  /**
   * The library package name to resolve the components from.
   * Defaults to "@code-ui/components".
   */
  library?: string;
  /**
   * Optional directory inside the library package where components reside.
   * Defaults to "runtime" for "@code-ui/components".
   */
  componentDir?: string;
  /**
   * Optional suffix to append to the resolved component path.
   * Defaults to "/index".
   */
  componentSuffix?: string;
}

export interface TreeShakeOptions {
  /**
   * Enable unused component tree-shaking
   */
  enable?: boolean;
  /**
   * The library package name to tree-shake.
   * Defaults to "@code-ui/components".
   */
  library?: string;
}

export interface CodeUIVitePluginOptions {
  /**
   * Custom working directory to locate cui.config.ts
   */
  cwd?: string;
  /**
   * Name of configuration file (defaults to 'cui')
   */
  configFile?: string;
  /**
   * Automatically inject setConfig into app.ts / app.js / app.tsx entry
   * Defaults to true
   */
  autoInject?: boolean;
  /**
   * Auto import configuration for MiniProgram WXML
   */
  autoImport?: boolean | AutoImportOptions;
  /**
   * Automatically detect and purge unused components from the build output
   */
  treeShake?: boolean | TreeShakeOptions;
}

const VIRTUAL_MODULE_ID = "virtual:cui/config";
const RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID;

const VIRTUAL_MODULE_SHORT = "virtual:cui-config";
const RESOLVED_VIRTUAL_MODULE_SHORT = "\0" + VIRTUAL_MODULE_SHORT;

function resolveLibrarySourceDir(
  libraryName: string,
  root: string,
): string | null {
  try {
    const req = createRequire(path.join(root, "package.json"));
    const pkgJsonPath = req.resolve(`${libraryName}/package.json`);
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
    const miniprogramDir = pkgJson.miniprogram || "";
    return path.join(path.dirname(pkgJsonPath), miniprogramDir);
  } catch {
    return null;
  }
}

function getDirSize(dir: string): number {
  let size = 0;
  if (!fs.existsSync(dir)) return size;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      size += getDirSize(fullPath);
    } else {
      size += stat.size;
    }
  }
  return size;
}

function copyDirFresh(src: string, dest: string) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  // Wipe any stale/partial leftover at dest first so cpSync never has to
  // merge into (and potentially collide with) an existing directory.
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true });
}

export function codeUI(options: CodeUIVitePluginOptions = {}): Plugin {
  let resolvedConfig: CodeUIConfig = { prefix: "cui" };
  let configPath: string | null = null;
  let server: ViteDevServer | null = null;
  let viteConfigObj: any = null;

  const autoInject = options.autoInject !== false;

  const autoImportOpts: AutoImportOptions =
    typeof options.autoImport === "boolean"
      ? { enable: options.autoImport }
      : options.autoImport || { enable: false };

  const treeShakeOpts: TreeShakeOptions =
    typeof options.treeShake === "boolean"
      ? { enable: options.treeShake }
      : options.treeShake || { enable: false };

  const prefix = autoImportOpts.prefix || "c";
  const library = autoImportOpts.library || "@code-ui/components";
  const tagRegex = new RegExp(`<(${prefix}-[a-zA-Z0-9-]+)[\\s>\\/]`, "g");

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
        resolvedConfig = config;
      }
      if (configFile) {
        configPath = configFile;
      }
    } catch (err) {
      console.warn("[code-ui] Failed to load cui.config.ts:", err);
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
          if (path.resolve(changedPath) === path.resolve(configPath!)) {
            await reloadConfig(devServer.config.root);
            const mod1 = server?.moduleGraph.getModuleById(
              RESOLVED_VIRTUAL_MODULE_ID,
            );
            const mod2 = server?.moduleGraph.getModuleById(
              RESOLVED_VIRTUAL_MODULE_SHORT,
            );
            if (mod1) server?.moduleGraph.invalidateModule(mod1);
            if (mod2) server?.moduleGraph.invalidateModule(mod2);
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
      return null;
    },

    load(id) {
      if (
        id === RESOLVED_VIRTUAL_MODULE_ID ||
        id === RESOLVED_VIRTUAL_MODULE_SHORT
      ) {
        return `
const config = ${JSON.stringify(resolvedConfig, null, 2)};
const g = typeof globalThis !== "undefined"
  ? globalThis
  : typeof window !== "undefined"
    ? window
    : typeof global !== "undefined"
      ? global
      : {};

g.__CODE_UI_GLOBAL_CONFIG__ = Object.assign(g.__CODE_UI_GLOBAL_CONFIG__ || {}, config);

export default config;
`;
      }
      return null;
    },

    transform(code, id) {
      const cleanId = id.split("?")[0];
      if (!cleanId) return null;

      if (autoInject) {
        const relPath = path.relative(projectRoot, cleanId).replace(/\\/g, "/");
        const isAppEntry =
          /^(?:src\/)?app\.(?:ts|js|tsx|jsx)$/.test(relPath) &&
          !cleanId.includes("node_modules");

        if (isAppEntry && !code.includes(VIRTUAL_MODULE_ID)) {
          return {
            code: `import "${VIRTUAL_MODULE_ID}";\n` + code,
            map: null,
          };
        }
      }

      // 2. Auto-import components into .json usingComponents
      if (!autoImportOpts.enable) return null;
      if (!cleanId.endsWith(".json")) return null;

      const wxmlPath = cleanId.replace(/\.json$/, ".wxml");
      if (!fs.existsSync(wxmlPath)) return null;

      this.addWatchFile(wxmlPath);

      try {
        const wxmlContent = fs.readFileSync(wxmlPath, "utf-8");
        const matches = Array.from(wxmlContent.matchAll(tagRegex));

        if (matches.length === 0) return null;

        const uniqueTags = [
          ...new Set(matches.map((m) => m[1]).filter(Boolean)),
        ] as string[];
        let isExportDefault = false;
        let isStringExport = false;
        let jsonStr = code.trim();
        if (jsonStr.startsWith("export default")) {
          isExportDefault = true;
          jsonStr = jsonStr
            .replace(/^export\s+default\s+/, "")
            .replace(/;?\s*$/, "");
        }

        let json: any;
        try {
          json = JSON.parse(jsonStr);
        } catch {
          try {
            // If JSON.parse fails (e.g. unquoted JS object keys), fallback to new Function
            json = new Function(`return (${jsonStr})`)();
          } catch {
            return null;
          }
        }

        if (typeof json === "string") {
          const trimmed = json.trim();
          if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
            try {
              json = JSON.parse(trimmed);
              isStringExport = true;
            } catch {
              return null;
            }
          } else {
            // Not a JSON object string (e.g. Vite asset hash in web mode); skip processing
            return null;
          }
        }

        if (!json || typeof json !== "object" || Array.isArray(json)) {
          return null;
        }

        let modified = false;
        json.usingComponents = json.usingComponents || {};

        const compDir =
          autoImportOpts.componentDir !== undefined
            ? autoImportOpts.componentDir
            : library === "@code-ui/components"
              ? "runtime"
              : "";
        const dirPrefix = compDir ? `${compDir}/` : "";

        for (const tag of uniqueTags) {
          if (!json.usingComponents[tag]) {
            // Strip the prefix to get the component name (e.g. c-button -> button)
            const componentName = tag.replace(new RegExp(`^${prefix}-`), "");
            const suffix =
              autoImportOpts.componentSuffix !== undefined
                ? autoImportOpts.componentSuffix
                : "/index";
            json.usingComponents[tag] =
              `${library}/${dirPrefix}${componentName}${suffix}`;
            modified = true;
          }
        }

        if (modified) {
          const resultStr = JSON.stringify(json, null, 2);
          let finalCode: string;
          if (isExportDefault) {
            if (isStringExport) {
              finalCode = `export default ${JSON.stringify(resultStr)};`;
            } else {
              finalCode = `export default ${resultStr};`;
            }
          } else {
            finalCode = resultStr;
          }
          return {
            code: finalCode,
            map: null,
          };
        }
      } catch (err) {
        console.warn(
          `[code-ui:auto-import] Failed to process ${cleanId}:`,
          err,
        );
      }

      return null;
    },

    generateBundle(_options, bundle) {
      if (!autoImportOpts.enable) return;

      const compDir =
        autoImportOpts.componentDir !== undefined
          ? autoImportOpts.componentDir
          : library === "@code-ui/components"
            ? "runtime"
            : "";
      const dirPrefix = compDir ? `${compDir}/` : "";
      const suffix =
        autoImportOpts.componentSuffix !== undefined
          ? autoImportOpts.componentSuffix
          : "/index";

      for (const [fileName, item] of Object.entries(bundle)) {
        if (item.type !== "asset" || !fileName.endsWith(".json")) continue;
        const source =
          typeof item.source === "string"
            ? item.source
            : item.source instanceof Uint8Array
              ? new TextDecoder().decode(item.source)
              : undefined;
        if (!source) continue;

        const candidates = [
          path.resolve(
            projectRoot,
            "src",
            fileName.replace(/\.json$/, ".wxml"),
          ),
          path.resolve(projectRoot, fileName.replace(/\.json$/, ".wxml")),
        ];

        let wxmlPath: string | null = null;
        for (const p of candidates) {
          if (fs.existsSync(p)) {
            wxmlPath = p;
            break;
          }
        }

        if (!wxmlPath) continue;

        try {
          const wxmlContent = fs.readFileSync(wxmlPath, "utf-8");
          const matches = Array.from(
            wxmlContent.matchAll(
              new RegExp(`<(${prefix}-[a-zA-Z0-9-]+)[\\s>\\/]`, "g"),
            ),
          );
          if (matches.length === 0) continue;

          const uniqueTags = [
            ...new Set(matches.map((m) => m[1]).filter(Boolean)),
          ] as string[];
          const json = JSON.parse(source);
          json.usingComponents = json.usingComponents || {};

          let modified = false;
          for (const tag of uniqueTags) {
            if (!json.usingComponents[tag]) {
              const componentName = tag.replace(new RegExp(`^${prefix}-`), "");
              json.usingComponents[tag] =
                `${library}/${dirPrefix}${componentName}${suffix}`;
              modified = true;
            }
          }

          if (modified) {
            item.source = JSON.stringify(json, null, 2);
          }
        } catch (err) {
          console.warn(
            `[code-ui:generateBundle] Failed to update ${fileName}:`,
            err,
          );
        }
      }
    },

    async closeBundle() {
      if (!treeShakeOpts.enable) return;

      const treeLibrary = treeShakeOpts.library || "@code-ui/components";
      const outDir = viteConfigObj?.build?.outDir || "dist";
      const distRoot = path.resolve(projectRoot, outDir);
      const miniprogramNpmPath = path.resolve(
        distRoot,
        "miniprogram_npm",
        treeLibrary,
      );

      const librarySourceDir = resolveLibrarySourceDir(
        treeLibrary,
        projectRoot,
      );
      if (!librarySourceDir) {
        console.warn(
          `[code-ui:tree-shake] Could not resolve "${treeLibrary}" in node_modules; skipping tree-shake this build so nothing gets deleted that can't be restored.`,
        );
        return;
      }

      if (!fs.existsSync(miniprogramNpmPath)) return;

      const runtimeDir = path.join(miniprogramNpmPath, "runtime");
      const wxsDir = path.join(miniprogramNpmPath, "wxs");

      // One-time cleanup: older versions of this plugin kept a trash folder
      // inside dist. It's no longer used or needed - remove it if present.
      const legacyTrashDir = path.join(miniprogramNpmPath, ".code-ui-trash");
      if (fs.existsSync(legacyTrashDir)) {
        fs.rmSync(legacyTrashDir, { recursive: true, force: true });
      }

      const usedComponents = new Set<string>();
      const usedWxs = new Set<string>();

      // Scan all .json files the app itself emitted (skip the copied library
      // directory so we only pick up genuine top-level usage here).
      function scanJson(dir: string) {
        if (!fs.existsSync(dir)) return;
        const items = fs.readdirSync(dir);
        for (const item of items) {
          if (item === "miniprogram_npm") continue;
          const fullPath = path.join(dir, item);
          if (fs.statSync(fullPath).isDirectory()) {
            scanJson(fullPath);
          } else if (item.endsWith(".json")) {
            try {
              const content = fs.readFileSync(fullPath, "utf-8");
              const json = JSON.parse(content);
              if (json.usingComponents) {
                for (const val of Object.values(json.usingComponents)) {
                  if (
                    typeof val === "string" &&
                    val.startsWith(treeLibrary + "/")
                  ) {
                    usedComponents.add(val);
                  }
                }
              }
            } catch (e) {
              // ignore malformed json
            }
          }
        }
      }

      scanJson(distRoot);

      // Deep scan for nested component usage. Read each component's json
      // from the *source* in node_modules, not the dist copy - the dist copy
      // may currently be missing (e.g. exactly the "purged, now needed
      // again" case), while the source is always present and authoritative.
      const queue = Array.from(usedComponents);
      const visited = new Set<string>(queue);
      while (queue.length > 0) {
        const current = queue.shift()!;
        const relPath = current.replace(treeLibrary + "/", "");
        const sourceJsonPath = path.resolve(
          librarySourceDir,
          relPath + ".json",
        );

        if (fs.existsSync(sourceJsonPath)) {
          try {
            const content = fs.readFileSync(sourceJsonPath, "utf-8");
            const json = JSON.parse(content);
            if (json.usingComponents) {
              for (const val of Object.values(json.usingComponents)) {
                if (
                  typeof val === "string" &&
                  val.startsWith(treeLibrary + "/") &&
                  !visited.has(val)
                ) {
                  visited.add(val);
                  usedComponents.add(val);
                  queue.push(val);
                }
              }
            }
          } catch (e) {
            // ignore malformed json
          }
        }
      }

      const usedComponentDirs = new Set<string>();
      for (const comp of usedComponents) {
        const relPath = comp.replace(treeLibrary + "/", "");
        const dirName = path.dirname(relPath).replace(/\\/g, "/");
        usedComponentDirs.add(dirName);

        const sourceWxmlPath = path.resolve(
          librarySourceDir,
          relPath + ".wxml",
        );
        if (fs.existsSync(sourceWxmlPath)) {
          const wxmlContent = fs.readFileSync(sourceWxmlPath, "utf-8");
          const wxsRegex = /<wxs[^>]+src=["']([^"']+)["'][^>]*>/g;
          let match;
          while ((match = wxsRegex.exec(wxmlContent)) !== null) {
            const src = match[1];
            const absoluteWxsPath = path.resolve(
              path.dirname(sourceWxmlPath),
              src,
            );
            const relWxs = path
              .relative(librarySourceDir, absoluteWxsPath)
              .replace(/\\/g, "/");
            usedWxs.add(relWxs);
          }
        }
      }

      let restoredComponents = 0;
      let restoredWxs = 0;
      let removedComponents = 0;
      let removedWxs = 0;
      let savedBytes = 0;

      // 1. REPAIR - make sure every currently-used component/WXS actually
      // exists in dist, copying fresh from node_modules whenever it's
      // missing. This is what makes a re-added component "come back": it no
      // longer depends on anything having survived in a trash folder.
      for (const relDir of usedComponentDirs) {
        const destDir = path.join(miniprogramNpmPath, relDir);
        const srcDir = path.join(librarySourceDir, relDir);
        if (!fs.existsSync(destDir) && fs.existsSync(srcDir)) {
          try {
            copyDirFresh(srcDir, destDir);
            restoredComponents++;
          } catch (err) {
            console.warn(
              `[code-ui:tree-shake] Failed to restore "${relDir}":`,
              err,
            );
          }
        }
      }

      for (const relWxs of usedWxs) {
        const destFile = path.join(miniprogramNpmPath, relWxs);
        const srcFile = path.join(librarySourceDir, relWxs);
        if (!fs.existsSync(destFile) && fs.existsSync(srcFile)) {
          try {
            fs.mkdirSync(path.dirname(destFile), { recursive: true });
            fs.copyFileSync(srcFile, destFile);
            restoredWxs++;
          } catch (err) {
            console.warn(
              `[code-ui:tree-shake] Failed to restore wxs "${relWxs}":`,
              err,
            );
          }
        }
      }

      if (restoredComponents > 0 || restoredWxs > 0) {
        console.log(
          `\n\x1b[36mℹ [code-ui:tree-shake] Restored ${restoredComponents} component(s) and ${restoredWxs} WXS script(s) that are in use again.\x1b[0m\n`,
        );
      }

      // 2. PURGE - remove whatever is still unused. Safe to delete outright
      // now: the permanent copy lives in node_modules, not in a folder
      // inside dist that a clean build could wipe out.
      if (fs.existsSync(runtimeDir)) {
        const components = fs.readdirSync(runtimeDir);
        for (const comp of components) {
          const compDir = path.join(runtimeDir, comp);
          if (fs.statSync(compDir).isDirectory()) {
            const relToLib = "runtime/" + comp;
            if (!usedComponentDirs.has(relToLib)) {
              try {
                savedBytes += getDirSize(compDir);
                fs.rmSync(compDir, { recursive: true, force: true });
                removedComponents++;
              } catch (err) {
                console.warn(
                  `[code-ui:tree-shake] Failed to purge "${relToLib}":`,
                  err,
                );
              }
            }
          }
        }
      }

      if (fs.existsSync(wxsDir)) {
        const files = fs.readdirSync(wxsDir);
        for (const file of files) {
          const relToLib = "wxs/" + file;
          if (file.endsWith(".wxs") && !usedWxs.has(relToLib)) {
            try {
              const wxsFile = path.join(wxsDir, file);
              savedBytes += fs.statSync(wxsFile).size;
              fs.rmSync(wxsFile, { force: true });
              removedWxs++;
            } catch (err) {
              console.warn(
                `[code-ui:tree-shake] Failed to purge wxs "${file}":`,
                err,
              );
            }
          }
        }
      }

      if (removedComponents > 0 || removedWxs > 0) {
        const kb = (savedBytes / 1024).toFixed(2);
        console.log(
          `\n\x1b[32m✔ [code-ui:tree-shake] Purged ${removedComponents} unused components and ${removedWxs} WXS scripts. Saved ${kb} KB.\x1b[0m\n`,
        );
      }
    },
  };
}

export default codeUI;
