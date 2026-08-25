import fs from "node:fs/promises";
import path from "node:path";
import pc from "picocolors";

export interface SyncCommandOptions {
  cwd?: string;
  components?: string[];
}

export async function syncCommand(options: SyncCommandOptions = {}) {
  const cwd = options.cwd ?? process.cwd();
  const configPath = path.join(cwd, "code-ui.json");

  // 1. Read configuration from code-ui.json if available
  let configComponents: string[] | undefined = options.components;
  let outputPath = path.join(cwd, "miniprogram_npm", "@code-ui", "components");

  try {
    const raw = await fs.readFile(configPath, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed.components && Array.isArray(parsed.components) && !configComponents) {
      configComponents = parsed.components;
    }
    if (parsed.outputPath) {
      outputPath = path.resolve(cwd, parsed.outputPath);
    }
  } catch {}

  // 2. Resolve source @code-ui/components/dist
  // Check node_modules or local monorepo
  const possiblePaths = [
    path.join(cwd, "node_modules", "@code-ui", "components", "dist"),
    path.resolve(cwd, "../../packages/components/dist"),
    path.resolve(cwd, "../components/dist"),
  ];

  let sourceDir: string | null = null;
  for (const p of possiblePaths) {
    try {
      await fs.access(p);
      sourceDir = p;
      break;
    } catch {}
  }

  if (!sourceDir) {
    console.log(
      pc.red("✖ Could not find @code-ui/components. Please ensure it is installed:"),
    );
    console.log(pc.cyan("  npm i @code-ui/components"));
    return;
  }

  // 3. Discover available components in dist
  let allComponents: string[] = [];
  try {
    const entries = await fs.readdir(sourceDir, { withFileTypes: true });
    allComponents = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith("_"))
      .map((e) => e.name);
  } catch {
    console.log(pc.red(`✖ Failed to read components from ${sourceDir}`));
    return;
  }

  const targetComponents =
    configComponents && configComponents.length > 0
      ? configComponents
      : allComponents;

  const mode = configComponents ? "selected" : "all (auto-discovered)";
  console.log(
    pc.blue(`📦 Syncing ${mode} components: [${targetComponents.join(", ")}]`),
  );

  // 4. Clean destination
  try {
    await fs.rm(outputPath, { recursive: true, force: true });
  } catch {}
  await fs.mkdir(outputPath, { recursive: true });

  // 5. Copy shared runtime
  const sharedSrc = path.join(sourceDir, "_shared");
  const sharedDest = path.join(outputPath, "_shared");
  try {
    await fs.access(sharedSrc);
    await fs.cp(sharedSrc, sharedDest, { recursive: true, force: true });
  } catch {}

  // 6. Copy selected components
  for (const comp of targetComponents) {
    const src = path.join(sourceDir, comp);
    const dest = path.join(outputPath, comp);
    try {
      await fs.access(src);
      await fs.cp(src, dest, { recursive: true, force: true });
    } catch {
      console.log(pc.yellow(`⚠️  Component not found in build dist: "${comp}"`));
    }
  }

  // 7. Write miniprogram_npm package.json descriptor
  const pkgJson = {
    name: "@code-ui/components",
    version: "0.0.1",
    miniprogram: ".",
  };
  await fs.writeFile(
    path.join(outputPath, "package.json"),
    JSON.stringify(pkgJson, null, 2),
    "utf-8",
  );

  console.log(pc.green(`✔ Synced @code-ui/components → ${outputPath}`));
}
