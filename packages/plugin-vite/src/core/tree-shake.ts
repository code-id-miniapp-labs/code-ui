import fs from "node:fs";
import path from "node:path";
import type {
  OutputBundleLike,
  ResolvedTreeShakeOptions,
  TreeShakeOptions,
} from "../types";
import { isBundleAsset } from "../types";
import { copyDirFresh, getDirSize, resolveLibrarySourceDir } from "./utils";

const utf8Decoder = new TextDecoder();
const WXS_TAG_RE = /<wxs[^>]+src=["']([^"']+)["'][^>]*>/g;
const WXS_REQUIRE_RE = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const REQUIRE_JS_RE = /require\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g;

function resolveJsRequireTarget(
  baseDir: string,
  reqPath: string,
): string | null {
  const target = path.resolve(baseDir, reqPath);
  const directStat = fs.statSync(target, { throwIfNoEntry: false });
  if (directStat && directStat.isFile()) {
    return target;
  }
  if (!target.endsWith(".js")) {
    const withJs = `${target}.js`;
    const jsStat = fs.statSync(withJs, { throwIfNoEntry: false });
    if (jsStat && jsStat.isFile()) return withJs;

    const indexJs = path.join(target, "index.js");
    const indexStat = fs.statSync(indexJs, { throwIfNoEntry: false });
    if (indexStat && indexStat.isFile()) return indexJs;
  }
  return null;
}

function collectTransitiveJsDeps(
  entryFile: string,
  rootDir: string,
  visited: Set<string> = new Set(),
): Set<string> {
  if (visited.has(entryFile)) return visited;
  visited.add(entryFile);

  if (!fs.existsSync(entryFile)) return visited;

  try {
    const content = fs.readFileSync(entryFile, "utf-8");
    REQUIRE_JS_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = REQUIRE_JS_RE.exec(content)) !== null) {
      const relTarget = match[1];
      if (relTarget) {
        const resolved = resolveJsRequireTarget(
          path.dirname(entryFile),
          relTarget,
        );
        if (
          resolved &&
          resolved.startsWith(rootDir) &&
          !visited.has(resolved)
        ) {
          collectTransitiveJsDeps(resolved, rootDir, visited);
        }
      }
    }
  } catch {
    // ignore read error
  }

  return visited;
}

interface LibraryDependencyGraph {
  sourceDir: string;
  /** component id (e.g. "@code-id-labs/components/runtime/drawer/index") -> direct component ids */
  componentDeps: Map<string, string[]>;
  /** component id -> direct WXS relative paths (e.g. "wxs/drawer-gesture.wxs") */
  componentWxs: Map<string, string[]>;
  /** WXS relative path -> direct required WXS relative paths */
  wxsDeps: Map<string, string[]>;
  /** All component directory paths relative to library root (e.g. "runtime/button") */
  allComponentDirs: string[];
  /** All WXS file paths relative to library root (e.g. "wxs/dom.wxs") */
  allWxsFiles: string[];
}

const libraryGraphCache = new Map<string, LibraryDependencyGraph>();

export function clearLibraryGraphCache(): void {
  libraryGraphCache.clear();
}

function getLibraryDependencyGraph(
  treeLibrary: string,
  librarySourceDir: string,
): LibraryDependencyGraph {
  const cacheKey = `${treeLibrary}\0${librarySourceDir}`;
  const cached = libraryGraphCache.get(cacheKey);

  const allComponentDirs: string[] = [];
  const allWxsFiles: string[] = [];

  const srcRuntimeDir = path.join(librarySourceDir, "runtime");
  if (fs.existsSync(srcRuntimeDir)) {
    try {
      const entries = fs.readdirSync(srcRuntimeDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith("_")) {
          allComponentDirs.push(`runtime/${entry.name}`);
        }
      }
    } catch {
      // ignore read error
    }
  }

  const srcWxsDir = path.join(librarySourceDir, "wxs");
  function collectAllWxs(dir: string) {
    if (!fs.existsSync(dir)) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          collectAllWxs(fullPath);
        } else if (entry.isFile() && entry.name.endsWith(".wxs")) {
          allWxsFiles.push(
            path.relative(librarySourceDir, fullPath).replace(/\\/g, "/"),
          );
        }
      }
    } catch {
      // ignore read error
    }
  }
  collectAllWxs(srcWxsDir);

  if (
    cached &&
    cached.allComponentDirs.length === allComponentDirs.length &&
    cached.allWxsFiles.length === allWxsFiles.length &&
    cached.allComponentDirs.every((d, i) => d === allComponentDirs[i]) &&
    cached.allWxsFiles.every((w, i) => w === allWxsFiles[i])
  ) {
    return cached;
  }

  const graph: LibraryDependencyGraph = {
    sourceDir: librarySourceDir,
    componentDeps: new Map(),
    componentWxs: new Map(),
    wxsDeps: new Map(),
    allComponentDirs,
    allWxsFiles,
  };

  libraryGraphCache.set(cacheKey, graph);
  return graph;
}

function getComponentDirectDeps(
  graph: LibraryDependencyGraph,
  treeLibrary: string,
  componentId: string,
): string[] {
  const cached = graph.componentDeps.get(componentId);
  if (cached !== undefined) return cached;

  const relPath = componentId.slice(treeLibrary.length + 1);
  const sourceJsonPath = path.resolve(graph.sourceDir, relPath + ".json");
  const deps: string[] = [];

  if (fs.existsSync(sourceJsonPath)) {
    try {
      const content = fs.readFileSync(sourceJsonPath, "utf-8");
      const json = JSON.parse(content);
      if (json?.usingComponents && typeof json.usingComponents === "object") {
        const prefix = treeLibrary + "/";
        for (const val of Object.values(json.usingComponents)) {
          if (typeof val === "string") {
            if (val.startsWith(prefix)) {
              deps.push(val);
            } else if (val.startsWith(".")) {
              const abs = path.resolve(path.dirname(sourceJsonPath), val);
              const rel = path.relative(graph.sourceDir, abs).replace(/\\/g, "/");
              deps.push(`${treeLibrary}/${rel}`);
            }
          }
        }
      }
    } catch {
      // ignore malformed json
    }
  }

  graph.componentDeps.set(componentId, deps);
  return deps;
}

function getComponentDirectWxs(
  graph: LibraryDependencyGraph,
  treeLibrary: string,
  componentId: string,
): string[] {
  const cached = graph.componentWxs.get(componentId);
  if (cached !== undefined) return cached;

  const relPath = componentId.slice(treeLibrary.length + 1);
  const sourceWxmlPath = path.resolve(graph.sourceDir, relPath + ".wxml");
  const wxsList: string[] = [];

  if (fs.existsSync(sourceWxmlPath)) {
    try {
      const wxmlContent = fs.readFileSync(sourceWxmlPath, "utf-8");
      WXS_TAG_RE.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = WXS_TAG_RE.exec(wxmlContent)) !== null) {
        const src = match[1];
        if (src) {
          const absoluteWxsPath = path.resolve(
            path.dirname(sourceWxmlPath),
            src,
          );
          const relWxs = path
            .relative(graph.sourceDir, absoluteWxsPath)
            .replace(/\\/g, "/");
          wxsList.push(relWxs);
        }
      }
    } catch {
      // ignore read error
    }
  }

  graph.componentWxs.set(componentId, wxsList);
  return wxsList;
}

function getWxsDirectDeps(
  graph: LibraryDependencyGraph,
  relWxs: string,
): string[] {
  const cached = graph.wxsDeps.get(relWxs);
  if (cached !== undefined) return cached;

  const absoluteWxsPath = path.resolve(graph.sourceDir, relWxs);
  const deps: string[] = [];

  if (fs.existsSync(absoluteWxsPath)) {
    try {
      const content = fs.readFileSync(absoluteWxsPath, "utf-8");
      WXS_REQUIRE_RE.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = WXS_REQUIRE_RE.exec(content)) !== null) {
        const reqPath = match[1];
        if (reqPath) {
          const normalizedReq = reqPath.endsWith(".wxs")
            ? reqPath
            : `${reqPath}.wxs`;
          const importedAbsolute = path.resolve(
            path.dirname(absoluteWxsPath),
            normalizedReq,
          );
          const relImported = path
            .relative(graph.sourceDir, importedAbsolute)
            .replace(/\\/g, "/");

          if (!relImported.startsWith("..") && !path.isAbsolute(relImported)) {
            deps.push(relImported);
          }
        }
      }
    } catch {
      // ignore read error
    }
  }

  graph.wxsDeps.set(relWxs, deps);
  return deps;
}

function isFileOutdated(srcFile: string, destFile: string): boolean {
  const srcStat = fs.statSync(srcFile, { throwIfNoEntry: false });
  if (!srcStat || !srcStat.isFile()) return false;
  const destStat = fs.statSync(destFile, { throwIfNoEntry: false });
  if (!destStat || !destStat.isFile()) return true;
  return (
    srcStat.size !== destStat.size || srcStat.mtimeMs > destStat.mtimeMs + 1
  );
}

function isComponentDirOutdated(srcDir: string, destDir: string): boolean {
  if (!fs.existsSync(destDir)) return true;
  try {
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(srcDir, entry.name);
      const destPath = path.join(destDir, entry.name);
      if (entry.isDirectory()) {
        if (isComponentDirOutdated(srcPath, destPath)) return true;
      } else if (entry.isFile()) {
        if (isFileOutdated(srcPath, destPath)) return true;
      }
    }
  } catch {
    return true;
  }
  return false;
}

function syncLibraryRootFiles(
  librarySourceDir: string,
  miniprogramNpmPath: string,
  treeShakeEnabled: boolean,
): void {
  try {
    const entries = fs.readdirSync(librarySourceDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (treeShakeEnabled && entry.name === "app.wxss") continue;
      const srcFile = path.join(librarySourceDir, entry.name);
      const destFile = path.join(miniprogramNpmPath, entry.name);
      if (isFileOutdated(srcFile, destFile)) {
        fs.copyFileSync(srcFile, destFile);
      }
    }
  } catch {
    // ignore error
  }
}

function syncSharedRuntimeDirs(
  librarySourceDir: string,
  miniprogramNpmPath: string,
): void {
  const srcRuntime = path.join(librarySourceDir, "runtime");
  if (!fs.existsSync(srcRuntime)) return;
  try {
    const entries = fs.readdirSync(srcRuntime, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith("_")) {
        const srcDir = path.join(srcRuntime, entry.name);
        const destDir = path.join(miniprogramNpmPath, "runtime", entry.name);
        if (isComponentDirOutdated(srcDir, destDir)) {
          copyDirFresh(srcDir, destDir);
        }
      }
    }
  } catch {
    // ignore error
  }
}

function hasMissingOrOutdatedLibraryFiles(
  miniprogramNpmPath: string,
  librarySourceDir: string,
  graph: LibraryDependencyGraph,
): boolean {
  const srcRuntime = path.join(librarySourceDir, "runtime");
  if (fs.existsSync(srcRuntime)) {
    try {
      const entries = fs.readdirSync(srcRuntime, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.startsWith("_")) {
          if (
            isComponentDirOutdated(
              path.join(srcRuntime, entry.name),
              path.join(miniprogramNpmPath, "runtime", entry.name),
            )
          ) {
            return true;
          }
        }
      }
    } catch {
      // ignore read error
    }
  }
  for (const relDir of graph.allComponentDirs) {
    if (
      isComponentDirOutdated(
        path.join(librarySourceDir, relDir),
        path.join(miniprogramNpmPath, relDir),
      )
    ) {
      return true;
    }
  }
  for (const relWxs of graph.allWxsFiles) {
    if (
      isFileOutdated(
        path.join(librarySourceDir, relWxs),
        path.join(miniprogramNpmPath, relWxs),
      )
    ) {
      return true;
    }
  }
  return false;
}

function snapshotDirActivity(dir: string): {
  count: number;
  maxMtimeMs: number;
} {
  let count = 0;
  let maxMtimeMs = 0;
  const rootStat = fs.statSync(dir, { throwIfNoEntry: false });
  if (!rootStat) return { count: 0, maxMtimeMs: 0 };
  maxMtimeMs = rootStat.mtimeMs;

  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      count++;
      const fullPath = path.join(current, entry.name);
      const st = fs.statSync(fullPath, { throwIfNoEntry: false });
      if (st && st.mtimeMs > maxMtimeMs) {
        maxMtimeMs = st.mtimeMs;
      }
      if (entry.isDirectory()) {
        stack.push(fullPath);
      }
    }
  }
  return { count, maxMtimeMs };
}

/**
 * Detects whether the active Vite config is running inside `weapp-vite`.
 */
export function isWeappViteConfig(
  viteConfig:
    | { plugins?: ReadonlyArray<{ name?: string }> }
    | null
    | undefined,
): boolean {
  return Boolean(
    viteConfig?.plugins?.some(
      (p) => typeof p?.name === "string" && p.name.startsWith("weapp-vite:"),
    ),
  );
}

const pendingExitTreeShakes = new Map<string, () => void>();
let exitHookRegistered = false;

function flushExitTreeShakes(code: number): void {
  exitHookRegistered = false;
  process.removeListener("beforeExit", onProcessBeforeExit);
  process.removeListener("exit", onProcessExit);
  const tasks = Array.from(pendingExitTreeShakes.values());
  pendingExitTreeShakes.clear();
  if (code !== 0) return;
  for (const run of tasks) {
    try {
      run();
    } catch (err) {
      console.warn("[code-ui:tree-shake] Deferred tree-shake failed:", err);
    }
  }
}

function onProcessBeforeExit(code: number): void {
  flushExitTreeShakes(code);
}

function onProcessExit(code: number): void {
  flushExitTreeShakes(code);
}

/**
 * Defers tree-shaking until the Node process is exiting cleanly (`code === 0`).
 *
 * `weapp-vite` runs `npmService.build()` (which copies `miniprogram_npm` and
 * then reads copied `.js` files in `collectCopiedPackageRequests`) concurrently
 * with the Vite build and only awaits it *after* Vite's `closeBundle` returns.
 * Running `handleTreeShake` (which is 100% synchronous) on clean process exit
 * guarantees `weapp-vite` has completely finished `npmService.build()` before
 * any unused files are deleted.
 */
export function scheduleTreeShakeOnExit(key: string, task: () => void): void {
  pendingExitTreeShakes.set(key, task);
  if (!exitHookRegistered) {
    exitHookRegistered = true;
    process.once("beforeExit", onProcessBeforeExit);
    process.once("exit", onProcessExit);
  }
}

/**
 * Flushes (or clears on non-zero exit code) any pending exit-deferred
 * tree-shake tasks. Primarily used in tests.
 */
export function flushPendingExitTreeShakes(code = 0): void {
  flushExitTreeShakes(code);
}

/**
 * Waits until `dist/miniprogram_npm` stops being actively written to
 * (e.g. by weapp-vite's concurrent `copyBuild` / `fs.cp`). Prevents ENOENT
 * races when tree-shake purges unused component directories during watch mode.
 */
export async function waitForMiniprogramNpmStable(
  treeShakeOpts: TreeShakeOptions | ResolvedTreeShakeOptions,
  projectRoot: string,
  viteConfigObj: { build?: { outDir?: string } } | null | undefined,
  options?: { settleMs?: number; maxWaitMs?: number },
): Promise<void> {
  const treeLibrary = treeShakeOpts.library || "@code-id-labs/components";
  const outDir = viteConfigObj?.build?.outDir || "dist";
  const miniprogramNpmRoot = path.resolve(
    projectRoot,
    outDir,
    "miniprogram_npm",
  );
  const miniprogramNpmPath = path.resolve(miniprogramNpmRoot, treeLibrary);
  if (!fs.existsSync(miniprogramNpmPath)) return;

  const watchDir = fs.existsSync(miniprogramNpmRoot)
    ? miniprogramNpmRoot
    : miniprogramNpmPath;

  const settleMs = options?.settleMs ?? 120;
  const maxWaitMs = options?.maxWaitMs ?? 3000;

  const prev = snapshotDirActivity(watchDir);
  if (Date.now() - prev.maxMtimeMs > settleMs * 2) {
    return;
  }

  const deadline = Date.now() + maxWaitMs;
  const poll = (
    previous: { count: number; maxMtimeMs: number },
  ): Promise<void> => {
    if (Date.now() >= deadline) return Promise.resolve();
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const next = snapshotDirActivity(watchDir);
        if (
          next.count === previous.count &&
          next.maxMtimeMs === previous.maxMtimeMs &&
          Date.now() - next.maxMtimeMs >= settleMs
        ) {
          resolve();
          return;
        }
        void poll(next).then(resolve);
      }, settleMs);
    });
  };

  return poll(prev);
}

export function handleTreeShake(
  treeShakeOpts: TreeShakeOptions | ResolvedTreeShakeOptions,
  projectRoot: string,
  viteConfigObj: { build?: { outDir?: string } } | null | undefined,
  bundle?: OutputBundleLike,
): void {
  const treeLibrary = treeShakeOpts.library || "@code-id-labs/components";
  const outDir = viteConfigObj?.build?.outDir || "dist";
  const distRoot = path.resolve(projectRoot, outDir);
  const miniprogramNpmPath = path.resolve(
    distRoot,
    "miniprogram_npm",
    treeLibrary,
  );

  if (!fs.existsSync(miniprogramNpmPath)) return;

  const librarySourceDir = resolveLibrarySourceDir(treeLibrary, projectRoot);
  if (!librarySourceDir) {
    console.warn(
      `[code-ui:tree-shake] Could not resolve "${treeLibrary}" in node_modules; skipping tree-shake this build so nothing gets deleted that can't be restored.`,
    );
    return;
  }

  const legacyTrashDir = path.join(miniprogramNpmPath, ".code-ui-trash");
  if (fs.existsSync(legacyTrashDir)) {
    fs.rmSync(legacyTrashDir, { recursive: true, force: true });
  }

  syncLibraryRootFiles(
    librarySourceDir,
    miniprogramNpmPath,
    Boolean(treeShakeOpts.enable),
  );

  syncSharedRuntimeDirs(librarySourceDir, miniprogramNpmPath);

  const graph = getLibraryDependencyGraph(treeLibrary, librarySourceDir);

  // Fast exit in dev mode (`treeShake: false`) when all library components/WXS are intact and up-to-date
  if (
    !treeShakeOpts.enable &&
    !hasMissingOrOutdatedLibraryFiles(
      miniprogramNpmPath,
      librarySourceDir,
      graph,
    )
  ) {
    return;
  }

  const usedComponents = new Set<string>();
  const usedWxs = new Set<string>();
  const prefix = treeLibrary + "/";

  function processJsonContent(content: string) {
    if (!content.includes(treeLibrary)) return;
    try {
      const json = JSON.parse(content);
      if (json?.usingComponents && typeof json.usingComponents === "object") {
        for (const val of Object.values(json.usingComponents)) {
          if (typeof val === "string" && val.startsWith(prefix)) {
            usedComponents.add(val);
          }
        }
      }
    } catch {
      // ignore malformed json
    }
  }

  const scannedBundleJsonPaths = new Set<string>();

  if (bundle) {
    for (const [fileName, item] of Object.entries(bundle)) {
      if (fileName.endsWith(".json") && isBundleAsset(item)) {
        scannedBundleJsonPaths.add(path.resolve(distRoot, fileName));
        const source =
          typeof item.source === "string"
            ? item.source
            : item.source instanceof Uint8Array
              ? utf8Decoder.decode(item.source)
              : undefined;
        if (source) processJsonContent(source);
      }
    }
  }

  function scanJsonDir(dir: string) {
    if (!fs.existsSync(dir)) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.name === "miniprogram_npm" || entry.name === "node_modules") {
        continue;
      }
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanJsonDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        if (scannedBundleJsonPaths.has(fullPath)) continue;
        try {
          const content = fs.readFileSync(fullPath, "utf-8");
          processJsonContent(content);
        } catch {
          // ignore error
        }
      }
    }
  }

  scanJsonDir(distRoot);

  // Resolve transitive component dependencies using cached library graph
  const queue = Array.from(usedComponents);
  const visited = new Set<string>(queue);
  for (const current of queue) {
    for (const dep of getComponentDirectDeps(graph, treeLibrary, current)) {
      if (!visited.has(dep)) {
        visited.add(dep);
        usedComponents.add(dep);
        queue.push(dep);
      }
    }
  }

  const usedComponentDirs = new Set<string>();
  for (const comp of usedComponents) {
    const relPath = comp.slice(prefix.length);
    const dirName = path.dirname(relPath).replace(/\\/g, "/");
    usedComponentDirs.add(dirName);

    for (const relWxs of getComponentDirectWxs(graph, treeLibrary, comp)) {
      usedWxs.add(relWxs);
    }
  }

  // Resolve transitive WXS dependencies using cached library graph
  const wxsQueue = Array.from(usedWxs);
  const visitedWxs = new Set<string>(wxsQueue);
  for (const currentRelWxs of wxsQueue) {
    for (const depWxs of getWxsDirectDeps(graph, currentRelWxs)) {
      if (!visitedWxs.has(depWxs)) {
        visitedWxs.add(depWxs);
        usedWxs.add(depWxs);
        wxsQueue.push(depWxs);
      }
    }
  }

  let restoredComponents = 0;
  let restoredWxs = 0;
  let restoredChunks = 0;
  let removedComponents = 0;
  let removedWxs = 0;
  let removedChunks = 0;
  let savedBytes = 0;

  const targetComponentDirs = treeShakeOpts.enable
    ? usedComponentDirs
    : new Set<string>([...graph.allComponentDirs, ...usedComponentDirs]);

  const targetWxsFiles = treeShakeOpts.enable
    ? usedWxs
    : new Set<string>([...graph.allWxsFiles, ...usedWxs]);

  for (const relDir of targetComponentDirs) {
    const destDir = path.join(miniprogramNpmPath, relDir);
    const srcDir = path.join(librarySourceDir, relDir);
    if (!fs.existsSync(srcDir)) {
      if (usedComponentDirs.has(relDir)) {
        console.warn(
          `[code-ui:tree-shake] Used component "${relDir}" was not found in "${librarySourceDir}". Did you rebuild "${treeLibrary}"?`,
        );
      }
      continue;
    }
    if (isComponentDirOutdated(srcDir, destDir)) {
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

  for (const relWxs of targetWxsFiles) {
    const destFile = path.join(miniprogramNpmPath, relWxs);
    const srcFile = path.join(librarySourceDir, relWxs);
    if (fs.existsSync(srcFile) && isFileOutdated(srcFile, destFile)) {
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

  const targetJsChunks = new Set<string>();
  for (const relDir of targetComponentDirs) {
    const srcDir = path.join(librarySourceDir, relDir);
    if (!fs.existsSync(srcDir)) continue;
    try {
      const entries = fs.readdirSync(srcDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith(".js")) {
          const fullJs = path.join(srcDir, entry.name);
          const deps = collectTransitiveJsDeps(fullJs, librarySourceDir);
          for (const dep of deps) {
            const relDep = path
              .relative(librarySourceDir, dep)
              .replace(/\\/g, "/");
            if (!relDep.startsWith("runtime/") || relDep.includes("/_")) {
              targetJsChunks.add(relDep);
            }
          }
        }
      }
    } catch {
      // ignore read error
    }
  }

  for (const relChunk of targetJsChunks) {
    const destFile = path.join(miniprogramNpmPath, relChunk);
    const srcFile = path.join(librarySourceDir, relChunk);
    if (fs.existsSync(srcFile) && isFileOutdated(srcFile, destFile)) {
      try {
        fs.mkdirSync(path.dirname(destFile), { recursive: true });
        fs.copyFileSync(srcFile, destFile);
        restoredChunks++;
      } catch (err) {
        console.warn(
          `[code-ui:tree-shake] Failed to restore chunk "${relChunk}":`,
          err,
        );
      }
    }
  }

  if (restoredComponents > 0 || restoredWxs > 0 || restoredChunks > 0) {
    console.log(
      `\n\x1b[36mℹ [code-ui:tree-shake] Restored ${restoredComponents} component(s), ${restoredWxs} WXS script(s), and ${restoredChunks} chunk(s) that are in use again.\x1b[0m\n`,
    );
  }

  if (treeShakeOpts.enable) {
    const runtimeDir = path.join(miniprogramNpmPath, "runtime");
    const wxsDir = path.join(miniprogramNpmPath, "wxs");

    if (fs.existsSync(runtimeDir)) {
      const entries = fs.readdirSync(runtimeDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (entry.name.startsWith("_")) {
            continue;
          }
          const relToLib = `runtime/${entry.name}`;
          if (!usedComponentDirs.has(relToLib)) {
            const compDir = path.join(runtimeDir, entry.name);
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
      function purgeUnusedWxs(dir: string): boolean {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        let remainingEntries = 0;

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            const isEmpty = purgeUnusedWxs(fullPath);
            if (isEmpty) {
              try {
                fs.rmdirSync(fullPath);
              } catch {
                remainingEntries++;
              }
            } else {
              remainingEntries++;
            }
          } else if (entry.isFile() && entry.name.endsWith(".wxs")) {
            const relToLib = path
              .relative(miniprogramNpmPath, fullPath)
              .replace(/\\/g, "/");
            if (!usedWxs.has(relToLib)) {
              try {
                savedBytes += fs.statSync(fullPath).size;
                fs.rmSync(fullPath, { force: true });
                removedWxs++;
              } catch (err) {
                remainingEntries++;
                console.warn(
                  `[code-ui:tree-shake] Failed to purge wxs "${relToLib}":`,
                  err,
                );
              }
            } else {
              remainingEntries++;
            }
          } else {
            remainingEntries++;
          }
        }

        return remainingEntries === 0;
      }
      purgeUnusedWxs(wxsDir);
    }

    const deadAppWxss = path.join(miniprogramNpmPath, "app.wxss");
    if (fs.existsSync(deadAppWxss)) {
      try {
        savedBytes += fs.statSync(deadAppWxss).size;
        fs.rmSync(deadAppWxss, { force: true });
      } catch {
        // ignore error
      }
    }

    const usedChunks = new Set<string>();
    if (fs.existsSync(runtimeDir)) {
      function scanRemainingRuntimeJs(dir: string) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            scanRemainingRuntimeJs(fullPath);
          } else if (entry.isFile() && entry.name.endsWith(".js")) {
            const deps = collectTransitiveJsDeps(fullPath, miniprogramNpmPath);
            for (const dep of deps) {
              const relDep = path
                .relative(miniprogramNpmPath, dep)
                .replace(/\\/g, "/");
              usedChunks.add(relDep);
            }
          }
        }
      }
      scanRemainingRuntimeJs(runtimeDir);
    }

    // Also preserve any library chunks (e.g. `computed.js`, `behaviors/app.js`)
    // directly required by the consumer app's own JS files outside `miniprogram_npm`.
    if (fs.existsSync(distRoot)) {
      const requireRx = /require\(\s*["'`]([^"'`]+)["'`]\s*\)/g;
      function scanConsumerJs(dir: string) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name === "miniprogram_npm") continue;
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            scanConsumerJs(fullPath);
          } else if (entry.isFile() && entry.name.endsWith(".js")) {
            let content = "";
            try {
              content = fs.readFileSync(fullPath, "utf8");
            } catch {
              continue;
            }
            for (const match of content.matchAll(requireRx)) {
              const spec = match[1];
              if (!spec || !spec.includes("miniprogram_npm")) continue;
              const resolvedBase = path.resolve(path.dirname(fullPath), spec);
              const candidate = resolvedBase.endsWith(".js")
                ? resolvedBase
                : `${resolvedBase}.js`;
              if (
                candidate.startsWith(miniprogramNpmPath + path.sep) &&
                fs.existsSync(candidate)
              ) {
                const relTarget = path
                  .relative(miniprogramNpmPath, candidate)
                  .replace(/\\/g, "/");
                usedChunks.add(relTarget);
                const deps = collectTransitiveJsDeps(
                  candidate,
                  miniprogramNpmPath,
                );
                for (const dep of deps) {
                  const relDep = path
                    .relative(miniprogramNpmPath, dep)
                    .replace(/\\/g, "/");
                  usedChunks.add(relDep);
                }
              }
            }
          }
        }
      }
      scanConsumerJs(distRoot);
    }

    function purgeUnusedChunksInDir(dir: string): boolean {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      let remainingEntries = 0;
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === "runtime" || entry.name === "wxs") {
            remainingEntries++;
            continue;
          }
          const isEmpty = purgeUnusedChunksInDir(fullPath);
          if (isEmpty) {
            try {
              fs.rmdirSync(fullPath);
            } catch {
              remainingEntries++;
            }
          } else {
            remainingEntries++;
          }
        } else if (entry.isFile()) {
          const relToLib = path
            .relative(miniprogramNpmPath, fullPath)
            .replace(/\\/g, "/");
          if (entry.name === "app.js" || entry.name === "app.json") {
            remainingEntries++;
            continue;
          }
          if (entry.name.endsWith(".js") && !usedChunks.has(relToLib)) {
            try {
              savedBytes += fs.statSync(fullPath).size;
              fs.rmSync(fullPath, { force: true });
              removedChunks++;
            } catch (err) {
              remainingEntries++;
              console.warn(
                `[code-ui:tree-shake] Failed to purge chunk "${relToLib}":`,
                err,
              );
            }
          } else {
            remainingEntries++;
          }
        }
      }
      return remainingEntries === 0;
    }
    purgeUnusedChunksInDir(miniprogramNpmPath);

    if (removedComponents > 0 || removedWxs > 0 || removedChunks > 0) {
      const kb = (savedBytes / 1024).toFixed(2);
      console.log(
        `\n\x1b[32m✔ [code-ui:tree-shake] Purged ${removedComponents} unused components, ${removedWxs} WXS scripts, and ${removedChunks} unreferenced chunks. Saved ${kb} KB.\x1b[0m\n`,
      );
    }
  }
}
