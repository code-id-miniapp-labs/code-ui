import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "c12";
import type { CodeUIConfig } from "@code-ui/core";

export const DEFAULT_CONFIG: CodeUIConfig = {
  prefix: "cui",
  ui: {
    colors: {
      primary: "#10b981",
      neutral: "#737373",
      danger: "#ef4444",
    },
    radius: {
      sm: "8rpx",
      md: "12rpx",
      lg: "16rpx",
    },
  },
  components: {},
};

export const CONFIG_FILE_NAMES = [
  "cui.config.ts",
  "cui.config.js",
  "cui.config.mjs",
];

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

export async function readConfigAsync(
  cwd = getProjectRoot(),
): Promise<CodeUIConfig | null> {
  try {
    const { config } = await loadConfig<CodeUIConfig>({
      name: "cui",
      configFile: "cui.config",
      cwd,
      rcFile: false,
    });
    if (config) {
      return {
        ...DEFAULT_CONFIG,
        ...config,
      };
    }
  } catch (err) {
    console.warn("Failed to load cui.config via c12:", err);
  }

  return getConfigPath(cwd) ? DEFAULT_CONFIG : null;
}
