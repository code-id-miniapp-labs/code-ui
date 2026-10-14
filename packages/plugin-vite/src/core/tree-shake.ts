import fs from "node:fs";
import path from "node:path";
import type { TreeShakeOptions } from "../index";
import { resolveLibrarySourceDir, getDirSize, copyDirFresh } from "./utils";

export function handleTreeShake(
  treeShakeOpts: TreeShakeOptions,
  projectRoot: string,
  viteConfigObj: any,
  bundle?: any,
) {
  const treeLibrary = treeShakeOpts.library || "@code-ui/components";
  const outDir = viteConfigObj?.build?.outDir || "dist";
  const distRoot = path.resolve(projectRoot, outDir);
  const miniprogramNpmPath = path.resolve(distRoot, "miniprogram_npm", treeLibrary);

  const librarySourceDir = resolveLibrarySourceDir(treeLibrary, projectRoot);
  if (!librarySourceDir) {
    console.warn(
      `[code-ui:tree-shake] Could not resolve "${treeLibrary}" in node_modules; skipping tree-shake this build so nothing gets deleted that can't be restored.`,
    );
    return;
  }

  if (!fs.existsSync(miniprogramNpmPath)) return;

  const runtimeDir = path.join(miniprogramNpmPath, "runtime");
  const wxsDir = path.join(miniprogramNpmPath, "wxs");

  const legacyTrashDir = path.join(miniprogramNpmPath, ".code-ui-trash");
  if (fs.existsSync(legacyTrashDir)) {
    fs.rmSync(legacyTrashDir, { recursive: true, force: true });
  }

  const usedComponents = new Set<string>();
  const usedWxs = new Set<string>();

  function processJsonContent(content: string) {
    try {
      const json = JSON.parse(content);
      if (json.usingComponents) {
        for (const val of Object.values(json.usingComponents)) {
          if (typeof val === "string" && val.startsWith(treeLibrary + "/")) {
            usedComponents.add(val);
          }
        }
      }
    } catch {
      // ignore malformed json
    }
  }

  if (bundle) {
    // Scan bundle
    for (const [fileName, item] of Object.entries(bundle)) {
      if ((item as any).type === "asset" && fileName.endsWith(".json")) {
        const source =
          typeof (item as any).source === "string"
            ? (item as any).source
            : (item as any).source instanceof Uint8Array
              ? new TextDecoder().decode((item as any).source)
              : undefined;
        if (source) processJsonContent(source);
      }
    }
  }

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
          processJsonContent(content);
        } catch {
          // ignore error
        }
      }
    }
  }

  scanJson(distRoot);

  const queue = Array.from(usedComponents);
  const visited = new Set<string>(queue);
  while (queue.length > 0) {
    const current = queue.shift()!;
    const relPath = current.replace(treeLibrary + "/", "");
    const sourceJsonPath = path.resolve(librarySourceDir, relPath + ".json");

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
      } catch {
        // ignore malformed json
      }
    }
  }

  const usedComponentDirs = new Set<string>();
  for (const comp of usedComponents) {
    const relPath = comp.replace(treeLibrary + "/", "");
    const dirName = path.dirname(relPath).replace(/\\/g, "/");
    usedComponentDirs.add(dirName);

    const sourceWxmlPath = path.resolve(librarySourceDir, relPath + ".wxml");
    if (fs.existsSync(sourceWxmlPath)) {
      const wxmlContent = fs.readFileSync(sourceWxmlPath, "utf-8");
      const wxsRegex = /<wxs[^>]+src=["']([^"']+)["'][^>]*>/g;
      let match;
      while ((match = wxsRegex.exec(wxmlContent)) !== null) {
        const src = match[1];
        if (src) {
          const absoluteWxsPath = path.resolve(path.dirname(sourceWxmlPath), src);
          const relWxs = path.relative(librarySourceDir, absoluteWxsPath).replace(/\\/g, "/");
          usedWxs.add(relWxs);
        }
      }
    }
  }

  // Deep scan for nested WXS dependencies
  const wxsQueue = Array.from(usedWxs);
  const visitedWxs = new Set<string>(wxsQueue);
  const wxsRequireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  while (wxsQueue.length > 0) {
    const currentRelWxs = wxsQueue.shift()!;
    const absoluteWxsPath = path.resolve(librarySourceDir, currentRelWxs);

    if (fs.existsSync(absoluteWxsPath)) {
      try {
        const content = fs.readFileSync(absoluteWxsPath, "utf-8");
        let match: RegExpExecArray | null;
        while ((match = wxsRequireRegex.exec(content)) !== null) {
          const reqPath = match[1];
          if (reqPath) {
            const normalizedReq = reqPath.endsWith(".wxs") ? reqPath : `${reqPath}.wxs`;
            const importedAbsolute = path.resolve(path.dirname(absoluteWxsPath), normalizedReq);
            const relImported = path
              .relative(librarySourceDir, importedAbsolute)
              .replace(/\\/g, "/");

            if (!relImported.startsWith("..") && !path.isAbsolute(relImported)) {
              if (!visitedWxs.has(relImported)) {
                visitedWxs.add(relImported);
                usedWxs.add(relImported);
                wxsQueue.push(relImported);
              }
            }
          }
        }
      } catch {
        // ignore read error
      }
    }
  }

  let restoredComponents = 0;
  let restoredWxs = 0;
  let removedComponents = 0;
  let removedWxs = 0;
  let savedBytes = 0;

  for (const relDir of usedComponentDirs) {
    const destDir = path.join(miniprogramNpmPath, relDir);
    const srcDir = path.join(librarySourceDir, relDir);
    if (!fs.existsSync(destDir) && fs.existsSync(srcDir)) {
      try {
        copyDirFresh(srcDir, destDir);
        restoredComponents++;
      } catch (err) {
        console.warn(`[code-ui:tree-shake] Failed to restore "${relDir}":`, err);
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
        console.warn(`[code-ui:tree-shake] Failed to restore wxs "${relWxs}":`, err);
      }
    }
  }

  if (restoredComponents > 0 || restoredWxs > 0) {
    console.log(
      `\n\x1b[36mℹ [code-ui:tree-shake] Restored ${restoredComponents} component(s) and ${restoredWxs} WXS script(s) that are in use again.\x1b[0m\n`,
    );
  }

  if (treeShakeOpts.enable) {
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
              console.warn(`[code-ui:tree-shake] Failed to purge "${relToLib}":`, err);
            }
          }
        }
      }
    }

    if (fs.existsSync(wxsDir)) {
      function purgeUnusedWxs(dir: string) {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          if (fs.statSync(fullPath).isDirectory()) {
            purgeUnusedWxs(fullPath);
            if (fs.existsSync(fullPath) && fs.readdirSync(fullPath).length === 0) {
              try {
                fs.rmdirSync(fullPath);
              } catch {}
            }
          } else if (item.endsWith(".wxs")) {
            const relToLib = path.relative(miniprogramNpmPath, fullPath).replace(/\\/g, "/");
            if (!usedWxs.has(relToLib)) {
              try {
                savedBytes += fs.statSync(fullPath).size;
                fs.rmSync(fullPath, { force: true });
                removedWxs++;
              } catch (err) {
                console.warn(`[code-ui:tree-shake] Failed to purge wxs "${relToLib}":`, err);
              }
            }
          }
        }
      }
      purgeUnusedWxs(wxsDir);
    }

    const deadAppWxss = path.join(miniprogramNpmPath, "app.wxss");
    if (fs.existsSync(deadAppWxss)) {
      try {
        savedBytes += fs.statSync(deadAppWxss).size;
        fs.rmSync(deadAppWxss, { force: true });
      } catch {}
    }

    if (removedComponents > 0 || removedWxs > 0) {
      const kb = (savedBytes / 1024).toFixed(2);
      console.log(
        `\n\x1b[32m✔ [code-ui:tree-shake] Purged ${removedComponents} unused components and ${removedWxs} WXS scripts. Saved ${kb} KB.\x1b[0m\n`,
      );
    }
  }
}
