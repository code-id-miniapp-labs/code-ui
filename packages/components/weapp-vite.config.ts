import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "weapp-vite";

function minifyWxss(): Plugin {
  return {
    name: "cui:minify-wxss",
    closeBundle() {
      const distDir = path.resolve(process.cwd(), "dist");
      const wxssPath = path.join(distDir, "app.wxss");
      if (fs.existsSync(wxssPath)) {
        const content = fs.readFileSync(wxssPath, "utf8");
        const minified = content
          .replace(/@import\s+['"][^'"]*tailwindcss[^'"]*['"];?/g, "")
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/\s*([{}:;,])\s*/g, "$1")
          .replace(/\s+/g, " ")
          .replace(/;}/g, "}")
          .trim();
        fs.writeFileSync(wxssPath, minified, "utf8");
      }

      // Ensure each component in dist has @import "../../app.wxss";
      const componentWxssFiles = [
        path.join(distDir, "runtime/button/index.wxss"),
        path.join(distDir, "runtime/drawer/index.wxss"),
      ];
      for (const compWxss of componentWxssFiles) {
        if (fs.existsSync(compWxss)) {
          const current = fs.readFileSync(compWxss, "utf8");
          if (!current.includes("app.wxss")) {
            fs.writeFileSync(
              compWxss,
              `@import "../../app.wxss";\n${current}`,
              "utf8",
            );
          }
        } else {
          fs.writeFileSync(compWxss, '@import "../../app.wxss";\n', "utf8");
        }
      }

      // Clear usingComponents in dist/app.json so npm package dist does not register components globally
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

      // Temporarily patch .wxml files on disk to resolve the alias to the hidden symlink
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
              // Map @machines/drawer-gesture.wxs to drawer/src/wxs/drawer-gesture.wxs
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
          fs.copyFileSync(file, path.join(targetDir, fileName));
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
  plugins: [minifyWxss(), wxmlPathPatchPlugin(), syncWxsFiles()],
  build: {
    outDir: "dist",
    emptyOutDir: false,
    minify: "terser",
    cssMinify: "lightningcss",
    sourcemap: false,
    terserOptions: {
      compress: {
        drop_debugger: true,
        passes: 2,
        module: true,
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
      },
    },
  },
  weapp: {
    srcRoot: "src",
    generate: {
      extensions: {
        js: "ts",
        wxss: "wxss",
      },
    },
  },
});
