import fs from "node:fs";
import path from "node:path";

export interface CodeUiConfig {
  $schema?: string;
  style: "wxss" | "scss";
  componentDir: string;
  typescript: boolean;
  prefix?: string;
}

export const DEFAULT_CONFIG: CodeUiConfig = {
  style: "wxss",
  componentDir: "src/components/ui",
  typescript: true,
  prefix: "cui-",
};

export const CONFIG_FILE_NAMES = ["code-ui.json", "components.json"];

export function getProjectRoot(): string {
  return process.cwd();
}

export function getConfigPath(cwd = getProjectRoot()): string | null {
  for (const name of CONFIG_FILE_NAMES) {
    const p = path.resolve(cwd, name);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export function readConfig(cwd = getProjectRoot()): CodeUiConfig | null {
  const configPath = getConfigPath(cwd);
  if (!configPath) return null;
  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function writeConfig(config: CodeUiConfig, cwd = getProjectRoot()): string {
  const filePath = path.resolve(cwd, "code-ui.json");
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), "utf-8");
  return filePath;
}
