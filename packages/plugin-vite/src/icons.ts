import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import tailwindcssIcons, { collectionNames } from "@egoist/tailwindcss-icons";

export interface CodeUIIconsTailwindOptions {
  collections?: Record<string, any>;
  scale?: number;
  prefix?: string;
  extraProperties?: Record<string, string>;
  strokeWidth?: number;
  collectionNamesAlias?: Record<string, string>;
}

const CURRENT_FILE =
  typeof __filename === "string" && path.isAbsolute(__filename)
    ? __filename
    : fileURLToPath(import.meta.url);
const req = createRequire(CURRENT_FILE);
const ICONS_DIR = path.dirname(CURRENT_FILE);

function loadJson(filePath: string): any | null {
  try {
    return req(filePath);
  } catch {
    return null;
  }
}

/**
 * Resolves the built-in Lucide collection from `@code-ui/plugin-vite`'s own
 * dependencies plus any additional `@iconify-json/*` or `@iconify/json`
 * collections installed in the user's project.
 */
export function resolveCodeUIIconCollections(
  cwd: string = process.cwd(),
): Record<string, any> {
  const collections: Record<string, any> = {};

  try {
    const lucidePath = req.resolve("@iconify-json/lucide/icons.json");
    const lucideJson = loadJson(lucidePath);
    if (lucideJson) {
      collections.lucide = lucideJson;
    }
  } catch {
    // fallback to project resolution below
  }

  const searchPaths = [cwd, ICONS_DIR];

  let iconifyFullDir: string | null = null;
  try {
    iconifyFullDir = path.dirname(
      req.resolve("@iconify/json/package.json", { paths: searchPaths }),
    );
  } catch {
    iconifyFullDir = null;
  }

  if (iconifyFullDir) {
    const jsonDir = path.join(iconifyFullDir, "json");
    if (fs.existsSync(jsonDir)) {
      for (const file of fs.readdirSync(jsonDir)) {
        if (!file.endsWith(".json")) continue;
        const json = loadJson(path.join(jsonDir, file));
        if (json && json.prefix) {
          collections[json.prefix] = json;
        }
      }
    }
    return collections;
  }

  for (const name of collectionNames) {
    if (collections[name]) continue;
    try {
      const jsonPath = req.resolve(`@iconify-json/${name}/icons.json`, {
        paths: searchPaths,
      });
      const json = loadJson(jsonPath);
      if (json) {
        collections[name] = json;
      }
    } catch {
      // collection not installed in project
    }
  }

  return collections;
}

/**
 * Tailwind CSS v4 plugin entrypoint used by `@plugin "@code-ui/plugin-vite/icons"`.
 * Ships with `@iconify-json/lucide` built in so components render icons with
 * zero extra setup, while automatically picking up any user-installed
 * `@iconify-json/<collection>` packages.
 */
const twIconsFn =
  typeof tailwindcssIcons === "function"
    ? tailwindcssIcons
    : ((tailwindcssIcons as { default?: typeof tailwindcssIcons }).default ??
      tailwindcssIcons);

function codeUIIconsPlugin(options?: CodeUIIconsTailwindOptions) {
  const collections =
    options?.collections ?? resolveCodeUIIconCollections(process.cwd());

  return twIconsFn({
    ...options,
    collections,
  } as any);
}

codeUIIconsPlugin.__isOptionsFunction = true as const;

export default codeUIIconsPlugin;
