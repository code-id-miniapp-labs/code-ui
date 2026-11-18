import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "weapp-vite";
import { transformWxmlSlots } from "@code-id-labs/compiler";
import { findFilesByExt } from "../utils/fs";

const SLOT_OPTIONS = { prefix: "c-" } as const;

/**
 * Resolves `@machines/*.wxs` relative symlinks during build and applies compile-time
 * slot detection (`slots="{{ ... }}"`) to component WXML modules.
 */
export function wxmlTransformPlugin(): Plugin {
  let createdSymlinks: string[] = [];
  const originalWxmlContents = new Map<string, string>();

  return {
    name: "cui:wxml-transform",
    enforce: "pre",

    buildStart() {
      const wxsDir = path.resolve(process.cwd(), "src/.wxs");
      if (!fs.existsSync(wxsDir)) {
        fs.mkdirSync(wxsDir, { recursive: true });
        createdSymlinks.push(wxsDir);
      }

      const machinesTarget = path.join(wxsDir, "machines");
      const utilsTarget = path.join(wxsDir, "utils");
      const machinesSrc = path.resolve(process.cwd(), "../machines");
      const utilsSrc = path.resolve(process.cwd(), "../utils");

      if (!fs.existsSync(machinesTarget)) {
        fs.symlinkSync(machinesSrc, machinesTarget);
        createdSymlinks.push(machinesTarget);
      }
      if (!fs.existsSync(utilsTarget)) {
        fs.symlinkSync(utilsSrc, utilsTarget);
        createdSymlinks.push(utilsTarget);
      }

      const wxmlFiles = findFilesByExt(
        path.resolve(process.cwd(), "src"),
        ".wxml",
      );
      for (const wxmlFile of wxmlFiles) {
        const content = fs.readFileSync(wxmlFile, "utf8");
        const patched = content.replace(
          /<wxs\s+(?:module="[^"]*"\s+)?src="([^"]+)"/g,
          (match, src: string) => {
            if (!src.startsWith("@machines/")) return match;
            const relPath = path.relative(
              path.dirname(wxmlFile),
              path.resolve(process.cwd(), "src/.wxs/machines/"),
            );
            const filename = src.replace("@machines/", "");
            const prefixMatch = filename.match(/^([a-z0-9-]+)-/);
            const componentName = prefixMatch
              ? prefixMatch[1]
              : filename.split(".")[0];
            const mappedPath = `${componentName}/src/wxs/${filename}`;
            return match.replace(src, `${relPath}/${mappedPath}`);
          },
        );
        if (content !== patched) {
          originalWxmlContents.set(wxmlFile, content);
          fs.writeFileSync(wxmlFile, patched, "utf8");
        }
      }
    },

    transform(code, id) {
      if (id.startsWith("\0")) return null;
      const cleanId = id.split("?")[0] ?? "";
      if (!cleanId.endsWith(".wxml")) return null;

      const res = transformWxmlSlots(code, SLOT_OPTIONS);
      return res.hasChanges ? { code: res.code, map: null } : null;
    },

    buildEnd() {
      for (const [wxmlFile, content] of originalWxmlContents.entries()) {
        if (fs.existsSync(wxmlFile)) {
          fs.writeFileSync(wxmlFile, content, "utf8");
        }
      }
      originalWxmlContents.clear();

      for (let i = createdSymlinks.length - 1; i >= 0; i--) {
        const link = createdSymlinks[i];
        if (link && fs.existsSync(link)) {
          fs.rmSync(link, { recursive: true, force: true });
        }
      }
      createdSymlinks = [];
    },
  };
}
