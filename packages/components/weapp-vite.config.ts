import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "weapp-vite";
import { codeUI } from "@code-ui/plugin-vite";

function minifyWxml(source: string): string {
  // Strip HTML comments first
  const noComments = source.replace(/<!--[\s\S]*?-->/g, "");
  let out = "";
  let i = 0;
  const len = noComments.length;
  let textDepth = 0;

  while (i < len) {
    if (noComments[i] === "<") {
      // Read until matching '>' outside quotes
      let tag = "<";
      i++;
      let quote = "";
      let prevSpace = false;
      while (i < len) {
        const ch = noComments[i] ?? "";
        i++;
        if (quote) {
          tag += ch;
          if (ch === quote) quote = "";
          continue;
        }
        if (ch === '"' || ch === "'") {
          quote = ch;
          prevSpace = false;
          tag += ch;
          continue;
        }
        if (ch === ">") {
          if (tag.endsWith(" ")) tag = tag.slice(0, -1);
          if (tag.endsWith(" /")) tag = `${tag.slice(0, -2)}/>`;
          else tag += ">";
          break;
        }
        if (ch === " " || ch === "\n" || ch === "\r" || ch === "\t") {
          if (!prevSpace && tag.length > 1) {
            tag += " ";
            prevSpace = true;
          }
          continue;
        }
        prevSpace = false;
        tag += ch;
      }
      if (/^<text(?:\s|>)/.test(tag) && !tag.endsWith("/>")) {
        textDepth++;
      } else if (/^<\/text>$/.test(tag) && textDepth > 0) {
        textDepth--;
      }
      out += tag;
    } else {
      const nextLt = noComments.indexOf("<", i);
      const chunk =
        nextLt === -1 ? noComments.slice(i) : noComments.slice(i, nextLt);
      i = nextLt === -1 ? len : nextLt;
      if (textDepth > 0) {
        out += chunk;
      } else if (chunk.trim().length > 0) {
        out += chunk.replace(/^\s*\n\s*|\s*\n\s*$/g, "");
      }
    }
  }
  return out.trim();
}

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
          fs.writeFileSync(appJsonPath, JSON.stringify(appJson), "utf8");
        } catch {}
      }

      for (const jsonFile of findFilesByExt(distDir, ".json")) {
        try {
          const parsed = JSON.parse(fs.readFileSync(jsonFile, "utf8"));
          if (parsed.styleIsolation === "apply-shared") {
            delete parsed.styleIsolation;
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
const WXS_RESERVED = new Set([
  "break", "case", "catch", "continue", "default", "delete", "do", "else",
  "false", "finally", "for", "function", "if", "in", "instanceof", "new",
  "null", "return", "switch", "this", "throw", "true", "try", "typeof",
  "undefined", "var", "void", "while", "arguments", "module", "exports",
  "require", "Math", "Number", "String", "Boolean", "Array", "Object",
  "Date", "JSON", "RegExp", "parseInt", "parseFloat", "isNaN", "isFinite",
  "getDate", "getRegExp", "console", "Infinity", "NaN",
]);

const WXS_IDENT_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";

function minifyWxs(source: string): string {
  type Tok = { k: "s" | "i" | "o"; v: string };
  const tokens: Tok[] = [];
  let i = 0;
  const n = source.length;

  while (i < n) {
    const ch = source[i] ?? "";
    // Block comment
    if (ch === "/" && source[i + 1] === "*") {
      const end = source.indexOf("*/", i + 2);
      i = end === -1 ? n : end + 2;
      continue;
    }
    // Line comment
    if (ch === "/" && source[i + 1] === "/") {
      const end = source.indexOf("\n", i + 2);
      i = end === -1 ? n : end + 1;
      continue;
    }
    // Whitespace
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      i++;
      continue;
    }
    // String literal
    if (ch === "'" || ch === '"') {
      let s = ch;
      i++;
      while (i < n) {
        const c = source[i] ?? "";
        s += c;
        i++;
        if (c === "\\") {
          if (i < n) {
            s += source[i] ?? "";
            i++;
          }
          continue;
        }
        if (c === ch) break;
      }
      tokens.push({ k: "s", v: s });
      continue;
    }
    // Identifier / keyword
    if (/[A-Za-z_$]/.test(ch)) {
      let id = ch;
      i++;
      while (i < n && /[A-Za-z0-9_$]/.test(source[i] ?? "")) {
        id += source[i] ?? "";
        i++;
      }
      tokens.push({ k: "i", v: id });
      continue;
    }
    // Number
    if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(source[i + 1] ?? ""))) {
      let num = ch;
      i++;
      while (i < n && /[0-9a-fA-FxX._eE+-]/.test(source[i] ?? "")) {
        const c = source[i] ?? "";
        if ((c === "+" || c === "-") && !/[eE]/.test(num[num.length - 1] ?? "")) break;
        num += c;
        i++;
      }
      tokens.push({ k: "o", v: num });
      continue;
    }
    // Multi-char operators
    const three = source.slice(i, i + 3);
    const two = source.slice(i, i + 2);
    if (three === "===" || three === "!==" || three === ">>>" || three === "<<=" || three === ">>=") {
      tokens.push({ k: "o", v: three });
      i += 3;
    } else if (
      two === "==" || two === "!=" || two === "<=" || two === ">=" ||
      two === "&&" || two === "||" || two === "++" || two === "--" ||
      two === "+=" || two === "-=" || two === "*=" || two === "/=" ||
      two === "%=" || two === "<<" || two === ">>"
    ) {
      tokens.push({ k: "o", v: two });
      i += 2;
    } else {
      tokens.push({ k: "o", v: ch });
      i++;
    }
  }

  // Collect declared identifiers (var x, y; function fn(a, b))
  const counts = new Map<string, number>();
  const markDecl = (name: string) => {
    if (!WXS_RESERVED.has(name)) counts.set(name, (counts.get(name) ?? 0) + 1);
  };

  for (let t = 0; t < tokens.length; t++) {
    const tok = tokens[t];
    if (!tok || tok.k !== "i") continue;
    if (tok.v === "function") {
      let p = t + 1;
      if (tokens[p]?.k === "i") {
        markDecl(tokens[p]?.v ?? "");
        p++;
      }
      if (tokens[p]?.v === "(") {
        p++;
        while (p < tokens.length && tokens[p]?.v !== ")") {
          if (tokens[p]?.k === "i") markDecl(tokens[p]?.v ?? "");
          p++;
        }
      }
    } else if (tok.v === "var") {
      let p = t + 1;
      let depth = 0;
      while (p < tokens.length) {
        const v = tokens[p]?.v ?? "";
        if (depth === 0 && (v === ";" || v === "in")) break;
        if (v === "(" || v === "[" || v === "{") depth++;
        else if (v === ")" || v === "]" || v === "}") {
          if (depth === 0) break;
          depth--;
        } else if (
          depth === 0 &&
          tokens[p]?.k === "i" &&
          (p === t + 1 || tokens[p - 1]?.v === ",")
        ) {
          markDecl(v);
        }
        p++;
      }
    }
  }

  // Count total occurrences to assign 1-char names to most frequent identifiers
  for (let t = 0; t < tokens.length; t++) {
    const tok = tokens[t];
    if (tok?.k === "i" && counts.has(tok.v)) {
      counts.set(tok.v, (counts.get(tok.v) ?? 0) + 1);
    }
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const rename = new Map<string, string>();
  let nameIdx = 0;
  const nextShortName = (): string => {
    while (true) {
      let idx = nameIdx++;
      let s = WXS_IDENT_CHARS[idx % WXS_IDENT_CHARS.length] ?? "a";
      idx = Math.floor(idx / WXS_IDENT_CHARS.length);
      while (idx > 0) {
        s += WXS_IDENT_CHARS[(idx - 1) % WXS_IDENT_CHARS.length] ?? "a";
        idx = Math.floor((idx - 1) / WXS_IDENT_CHARS.length);
      }
      if (!WXS_RESERVED.has(s)) return s;
    }
  };
  for (const [orig] of sorted) rename.set(orig, nextShortName());

  // Emit minified ES5 WXS
  let out = "";
  for (let t = 0; t < tokens.length; t++) {
    const tok = tokens[t];
    if (!tok) continue;
    let val = tok.v;
    if (tok.k === "i" && rename.has(val)) {
      const prev = tokens[t - 1]?.v;
      const next = tokens[t + 1]?.v;
      const isMember = prev === ".";
      const isObjKey = next === ":" && (prev === "{" || prev === ",");
      if (!isMember && !isObjKey) {
        val = rename.get(val) ?? val;
      }
    }
    if ((val === "}" || val === "]") && out.endsWith(",")) {
      out = out.slice(0, -1);
    }
    const prevChar = out[out.length - 1] ?? "";
    const firstChar = val[0] ?? "";
    if (
      prevChar &&
      ((/[A-Za-z0-9_$]/.test(prevChar) && /[A-Za-z0-9_$]/.test(firstChar)) ||
        (prevChar === "+" && firstChar === "+") ||
        (prevChar === "-" && firstChar === "-"))
    ) {
      out += " ";
    }
    out += val;
  }
  return out;
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
          const raw = fs
            .readFileSync(file, "utf8")
            .replace(
              /require\(\s*['"][^'"]*\/dom\.wxs['"]\s*\)/g,
              "require('./dom.wxs')",
            );
          const minified = minifyWxs(raw);
          fs.writeFileSync(path.join(targetDir, fileName), minified, "utf8");
        }
      }

      // Rewrite paths to our consolidated /wxs/ folder using relative paths (WeChat requires relative paths for WXS)
      const wxmlFiles = findFilesByExt(distDir, ".wxml");
      for (const wxmlFile of wxmlFiles) {
        const content = fs.readFileSync(wxmlFile, "utf8");
        const rewritten = content.replace(
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
        const minifiedWxml = minifyWxml(rewritten);
        if (content !== minifiedWxml) {
          fs.writeFileSync(wxmlFile, minifiedWxml, "utf8");
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
    // terserOptions: {
    //   toplevel: true,
    //   compress: {
    //     drop_debugger: true,
    //     drop_console: true,
    //     passes: 3,
    //     module: true,
    //   },
    //   mangle: {
    //     toplevel: true,
    //   },
    //   format: {
    //     comments: false,
    //   },
    // },
    rolldownOptions: {
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
      },
      output: {
        codeSplitting: {
          groups: [
            {
              name: "alien-signals",
              test: /[\\/]alien-signals[\\/]/,
            },
            {
              name: "behaviors/stepper",
              test: /[\\/]behaviors[\\/]stepper/,
            },
            {
              name: "behaviors/accordion",
              test: /[\\/]behaviors[\\/]accordion/,
            },
            {
              name: "behaviors/tabs",
              test: /[\\/]behaviors[\\/]tabs/,
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
              test: /[\\/]behaviors[\\/]form|[\\/]machines[\\/]form[\\/]dist[\\/]context\.|[\\/]context[\\/]dist[\\/]/,
            },
            {
              name: "behaviors/app",
              test: /[\\/]behaviors[\\/]app/,
            },
            {
              name: "behaviors/avatar-group",
              test: /[\\/]behaviors[\\/]avatar-group/,
            },
            {
              name: "behaviors/toast",
              test: /[\\/]behaviors[\\/]toast/,
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
