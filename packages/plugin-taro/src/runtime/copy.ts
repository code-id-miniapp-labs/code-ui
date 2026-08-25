import fs from "node:fs/promises";
import path from "node:path";
import type { CodeUIPluginOptions } from "../types";

export async function discoverComponents(
  sourcePath: string,
): Promise<string[]> {
  try {
    const entries = await fs.readdir(sourcePath, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() && !e.name.startsWith("_"))
      .map((e) => e.name);
  } catch {
    return [];
  }
}

export async function copyComponents(
  appPath: string,
  options: CodeUIPluginOptions,
): Promise<void> {
  const {
    components,
    sourcePath = path.join(
      appPath,
      "node_modules",
      "@code-ui",
      "components",
      "dist",
    ),
    outputPath = path.join(
      appPath,
      "dist",
      "miniprogram_npm",
      "@code-ui",
      "components",
    ),
  } = options;

  // Check the source exists before attempting copy
  try {
    await fs.access(sourcePath);
  } catch {
    console.warn(
      `[code-ui] ⚠️  Could not find @code-ui/components at:\n  ${sourcePath}\n  Skipping asset copy. Is @code-ui/components installed?`,
    );
    return;
  }

  // Discover all component directories available in source (excluding internal _shared)
  const allComponents = await discoverComponents(sourcePath);

  // Resolve target components:
  // - undefined (no option given) → all discovered components
  // - string[] (user-specified)   → use only those
  const targetComponents = components ?? allComponents;

  if (targetComponents.length === 0) {
    console.warn(`[code-ui] ⚠️  No components found in ${sourcePath}`);
    return;
  }

  const mode = components ? "selected" : "all (auto-discovered)";
  console.log(
    `[code-ui] 📦 Copying ${mode} components: [${targetComponents.join(", ")}]`,
  );

  try {
    await fs.rm(outputPath, { recursive: true, force: true });
  } catch {}
  await fs.mkdir(outputPath, { recursive: true });

  const sharedSrc = path.join(sourcePath, "_shared");
  const sharedDest = path.join(outputPath, "_shared");
  try {
    await fs.access(sharedSrc);
    await fs.cp(sharedSrc, sharedDest, { recursive: true, force: true });
  } catch {
    // If no _shared chunk exists, continue
  }

  for (const comp of targetComponents) {
    const srcDir = path.join(sourcePath, comp);
    const destDir = path.join(outputPath, comp);
    try {
      await fs.access(srcDir);
      await fs.cp(srcDir, destDir, { recursive: true, force: true });
    } catch {
      console.warn(`[code-ui] ⚠️  Component directory not found: ${srcDir}`);
    }
  }

  // 3. Write miniprogram npm package.json descriptor so WeChat resolves @code-ui/components as a valid npm package
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

  console.log(`[code-ui] ✅ Done → ${outputPath}`);
}
