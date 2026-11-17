import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "weapp-vite";
import { transformWxmlSlots } from "@code-ui/compiler";
import { findFilesByExt } from "../utils/fs";
import { minifyWxml } from "../utils/minify-wxml";
import { minifyWxs } from "../utils/minify-wxs";

const SLOT_OPTIONS = { prefix: "c-" } as const;

/**
 * Consolidates & minifies WXS scripts into `dist/wxs`, rewrites WXML `<wxs src>`
 * references, applies compile-time slot detection, and minifies emitted WXML files.
 */
export function syncWxsPlugin(): Plugin {
  return {
    name: "cui:sync-wxs",

    closeBundle() {
      const machinesDir = path.resolve(process.cwd(), "../machines");
      const utilsDir = path.resolve(process.cwd(), "../utils/src");
      const targetDir = path.resolve(process.cwd(), "dist/wxs");
      const distDir = path.resolve(process.cwd(), "dist");

      const wxsFiles = [
        ...findFilesByExt(machinesDir, ".wxs"),
        ...findFilesByExt(utilsDir, ".wxs"),
      ];

      if (wxsFiles.length > 0) {
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        for (const file of wxsFiles) {
          const fileName = path.basename(file);
          const raw = fs
            .readFileSync(file, "utf8")
            .replace(
              /require\(\s*['"][^'"]*\/dom\.wxs['"]\s*\)/g,
              "require('./dom.wxs')",
            );
          fs.writeFileSync(path.join(targetDir, fileName), minifyWxs(raw), "utf8");
        }
      }

      const wxmlFiles = findFilesByExt(distDir, ".wxml");
      for (const wxmlFile of wxmlFiles) {
        const content = fs.readFileSync(wxmlFile, "utf8");
        const rewritten = content.replace(
          /<wxs\s+(?:module="[^"]*"\s+)?src="[^"]*\/([^/"]+\.wxs)"/g,
          (match, filename: string) => {
            const targetFile = path.join(targetDir, filename);
            let rel = path
              .relative(path.dirname(wxmlFile), targetFile)
              .replace(/\\/g, "/");
            if (!rel.startsWith(".")) {
              rel = `./${rel}`;
            }
            return match.replace(/src="[^"]+"/, `src="${rel}"`);
          },
        );
        const slotted = transformWxmlSlots(rewritten, SLOT_OPTIONS).code;
        const minified = minifyWxml(slotted);
        if (content !== minified) {
          fs.writeFileSync(wxmlFile, minified, "utf8");
        }
      }

      const externalDir = path.join(distDir, "weapp_vite_external");
      if (fs.existsSync(externalDir)) {
        fs.rmSync(externalDir, { recursive: true, force: true });
      }
    },
  };
}
