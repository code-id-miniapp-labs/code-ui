import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

export type PackageManager = "pnpm" | "yarn" | "npm";

export function detectPackageManager(cwd = process.cwd()): PackageManager {
  if (fs.existsSync(path.resolve(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.resolve(cwd, "yarn.lock"))) return "yarn";
  if (fs.existsSync(path.resolve(cwd, "package-lock.json"))) return "npm";
  return "npm";
}

export function installDependencies(
  dependencies: string[],
  options: { cwd?: string; dev?: boolean } = {}
) {
  if (!dependencies || dependencies.length === 0) return;
  const cwd = options.cwd || process.cwd();
  const pm = detectPackageManager(cwd);

  const isDev = options.dev ? (pm === "yarn" ? "--dev" : "-D") : "";
  let command = "";

  if (pm === "pnpm") {
    command = `pnpm add ${isDev} ${dependencies.join(" ")}`;
  } else if (pm === "yarn") {
    command = `yarn add ${isDev} ${dependencies.join(" ")}`;
  } else {
    command = `npm install ${isDev} ${dependencies.join(" ")}`;
  }

  try {
    execSync(command, { cwd, stdio: "inherit" });
  } catch (error) {
    throw new Error(`Failed to install dependencies: ${command}`);
  }
}
