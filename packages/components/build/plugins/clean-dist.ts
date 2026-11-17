import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "weapp-vite";
import { findFilesByExt } from "../utils/fs";

/**
 * Post-processes `dist/` metadata and CJS export getters after `weapp-vite` finishes writing files.
 */
export function cleanDistPlugin(): Plugin {
  return {
    name: "cui:clean-dist",

    closeBundle() {
      const distDir = path.resolve(process.cwd(), "dist");

      const appJsonPath = path.join(distDir, "app.json");
      if (fs.existsSync(appJsonPath)) {
        try {
          const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));
          appJson.usingComponents = {};
          fs.writeFileSync(appJsonPath, JSON.stringify(appJson), "utf8");
        } catch {}
      }

      for (const jsonFile of findFilesByExt(distDir, ".json")) {
        try {
          const parsed = JSON.parse(fs.readFileSync(jsonFile, "utf8"));
          if (parsed.component === true) {
            parsed.styleIsolation = "shared";
          }
          fs.writeFileSync(jsonFile, JSON.stringify(parsed), "utf8");
        } catch {}
      }

      for (const jsFile of findFilesByExt(distDir, ".js")) {
        try {
          const content = fs.readFileSync(jsFile, "utf8");
          const replaced = content.replace(
            /Object\.defineProperty\(exports,"([^"]+)",\{enumerable:!0,get:function\(\)\{return ([^}]+)\}\}\)/g,
            "exports.$1=$2",
          );
          if (replaced !== content) {
            fs.writeFileSync(jsFile, replaced, "utf8");
          }
        } catch {}
      }
    },
  };
}
