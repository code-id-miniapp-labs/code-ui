import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "weapp-vite";
import { codeUI } from "@code-ui/plugin-vite";

function cleanDist(): Plugin {
  return {
    name: "cui:clean-dist",
    closeBundle() {
      const distDir = path.resolve(process.cwd(), "dist");

      const appJsonPath = path.join(distDir, "app.json");
      if (fs.existsSync(appJsonPath)) {
        try {
          const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));
          appJson.usingComponents = {};
          fs.writeFileSync(
            appJsonPath,
            JSON.stringify(appJson, null, 2),
            "utf8",
          );
        } catch {}
      }
    },
  };
}

function findFilesByExt(dir: string, ext: string, fileList: string[] = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findFilesByExt(filePath, ext, fileList);
    } else if (filePath.endsWith(ext)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function wxmlPathPatchPlugin(): Plugin {
  let createdSymlinks: string[] = [];
  const originalWxmlContents = new Map<string, string>();

  return {
    name: "cui:wxml-path-patch",
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
          (match, src) => {
            if (src.startsWith("@machines/")) {
              const relPath = path.relative(
                path.dirname(wxmlFile),
                path.resolve(process.cwd(), "src/.wxs/machines/"),
              );
              const filename = src.replace("@machines/", "");

              // Extract the prefix (e.g. "drawer" from "drawer-gesture.wxs")
              const prefixMatch = filename.match(/^([a-z0-9-]+)-/);
              const componentName = prefixMatch
                ? prefixMatch[1]
                : filename.split(".")[0];

              const mappedPath = `${componentName}/src/wxs/${filename}`;
              return match.replace(src, `${relPath}/${mappedPath}`);
            }
            return match;
          },
        );
        if (content !== patched) {
          originalWxmlContents.set(wxmlFile, content);
          fs.writeFileSync(wxmlFile, patched, "utf8");
        }
      }
    },
    buildEnd() {
      // Restore original .wxml files
      for (const [wxmlFile, content] of originalWxmlContents.entries()) {
        if (fs.existsSync(wxmlFile)) {
          fs.writeFileSync(wxmlFile, content, "utf8");
        }
      }
      originalWxmlContents.clear();

      // Clean up temporary symlinks and directories
      for (let i = createdSymlinks.length - 1; i >= 0; i--) {
        const link = createdSymlinks[i];
        if (fs.existsSync(link)) {
          fs.rmSync(link, { recursive: true, force: true });
        }
      }
      createdSymlinks = [];
    },
  };
}
function syncWxsFiles(): Plugin {
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
          const raw = fs.readFileSync(file, "utf8");
          const minified = raw
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .replace(/(^|[^:])\/\/.*/g, "$1")
            .replace(/\s+/g, " ")
            .replace(/\s*([;{}(),=+\-*\/?:<>!])\s*/g, "$1")
            .trim();
          fs.writeFileSync(path.join(targetDir, fileName), minified, "utf8");
        }
      }

      // Rewrite paths to our consolidated /wxs/ folder using relative paths (WeChat requires relative paths for WXS)
      const wxmlFiles = findFilesByExt(distDir, ".wxml");
      for (const wxmlFile of wxmlFiles) {
        const content = fs.readFileSync(wxmlFile, "utf8");
        const newContent = content.replace(
          /<wxs\s+(?:module="[^"]*"\s+)?src="[^"]*\/([^/"]+\.wxs)"/g,
          (match, filename) => {
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
        if (content !== newContent) {
          fs.writeFileSync(wxmlFile, newContent, "utf8");
        }
      }

      const externalDir = path.join(distDir, "weapp_vite_external");
      if (fs.existsSync(externalDir)) {
        fs.rmSync(externalDir, { recursive: true, force: true });
      }
    },
  };
}

export default defineConfig({
  plugins: [
    codeUI({ autoImport: false }),
    cleanDist(),
    wxmlPathPatchPlugin(),
    syncWxsFiles(),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: false,
    minify: true,
    cssMinify: "lightningcss",
    sourcemap: false,
    terserOptions: {
      toplevel: true,
      compress: {
        drop_debugger: true,
        drop_console: true,
        passes: 3,
        module: true,
      },
      mangle: {
        toplevel: true,
      },
      format: {
        comments: false,
      },
    },
    rolldownOptions: {
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
      },
      output: {
        codeSplitting: {
          groups: [
            {
              name: "behaviors/stepper",
              test: /[\\/]behaviors[\\/]stepper/,
            },
            {
              name: "behaviors/radio",
              test: /[\\/]behaviors[\\/]radio/,
            },
            {
              name: "behaviors/checkbox",
              test: /[\\/]behaviors[\\/]checkbox/,
            },
            {
              name: "behaviors/form",
              test: /[\\/]behaviors[\\/]form/,
            },
          ],
        },
      },
    },
  },
  weapp: {
    srcRoot: "src",
    tailwindcss: false,
    generate: {
      extensions: {
        js: "ts",
        wxss: "wxss",
      },
    },
  },
});
