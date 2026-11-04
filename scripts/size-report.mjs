#!/usr/bin/env node
/**
 * Size report for packages/components/dist.
 *
 * Method (matches docs/bundle-size-optimization.md):
 *  - Reachability from each runtime component dir via `usingComponents` (json),
 *    relative require/import (js), and src/import/include (wxml).
 *  - Gzip each file with level 9, sum per component.
 *
 * Usage: node scripts/size-report.mjs [--dist packages/components/dist] [--json]
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join, dirname, resolve, relative, extname } from "node:path";

const args = process.argv.slice(2);
const distArg = args.includes("--dist") ? args[args.indexOf("--dist") + 1] : "packages/components/dist";
const asJson = args.includes("--json");
const dist = resolve(distArg);
const runtime = join(dist, "runtime");

if (!existsSync(runtime)) {
  console.error(`Missing ${runtime}. Run: pnpm --filter @code-ui/components build`);
  process.exit(1);
}

const gz = (file) => gzipSync(readFileSync(file), { level: 9 }).length;
const kb = (n) => (n / 1024).toFixed(1);

const EXT = [".js", ".wxml", ".wxss", ".json", ".wxs"];

function resolveFile(from, spec) {
  const base = spec.startsWith("/") ? join(dist, spec) : resolve(dirname(from), spec);
  const candidates = [base, ...EXT.map((e) => base + e), ...EXT.map((e) => join(base, "index" + e))];
  return candidates.find((c) => existsSync(c) && statSync(c).isFile());
}

function deps(file) {
  const ext = extname(file);
  const text = readFileSync(file, "utf8");
  const out = [];
  const add = (spec) => {
    const f = resolveFile(file, spec);
    if (f) out.push(f);
  };
  if (ext === ".js" || ext === ".wxs") {
    for (const m of text.matchAll(/(?:require\(|from\s+|import\s+)["'](\.{1,2}\/[^"']+)["']/g)) add(m[1]);
  } else if (ext === ".wxml") {
    for (const m of text.matchAll(/<(?:import|include|wxs)\b[^>]*\bsrc="([^"]+)"/g)) add(m[1]);
  } else if (ext === ".json") {
    try {
      const json = JSON.parse(text);
      for (const spec of Object.values(json.usingComponents ?? {})) add(String(spec));
    } catch {}
  }
  if (ext === ".wxss") {
    for (const m of text.matchAll(/@import\s+["']([^"']+)["']/g)) add(m[1]);
  }
  return out;
}

function reachable(dir) {
  const seen = new Set();
  const stack = EXT.map((e) => join(dir, "index" + e)).filter(existsSync);
  while (stack.length) {
    const f = stack.pop();
    if (seen.has(f)) continue;
    seen.add(f);
    // Following a component json pulls its sibling files too.
    if (extname(f) === ".json" && f !== join(dir, "index.json")) {
      const d = dirname(f);
      for (const e of EXT) {
        const s = join(d, "index" + e);
        if (existsSync(s)) stack.push(s);
      }
    }
    stack.push(...deps(f));
  }
  return seen;
}

const components = readdirSync(runtime).filter((d) => statSync(join(runtime, d)).isDirectory());
const rows = components.map((name) => {
  const files = reachable(join(runtime, name));
  let total = 0;
  let own = 0;
  for (const f of files) {
    const s = gz(f);
    total += s;
    if (f.startsWith(join(runtime, name) + "/")) own += s;
  }
  return { name, own, total, shared: total - own, files: files.size };
});

// Shared chunks: every non-runtime js file in dist.
function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}
const chunks = walk(dist)
  .filter((f) => !f.startsWith(runtime + "/") && EXT.includes(extname(f)))
  .map((f) => ({
    file: relative(dist, f),
    raw: statSync(f).size,
    gzip: gz(f),
    // number of runtime components that reach this chunk
    usedBy: rows.filter((r) => reachable(join(runtime, r.name)).has(f)).length,
  }))
  .sort((a, b) => b.gzip - a.gzip);

const runtimeTotal = rows.reduce((n, r) => n + r.own, 0);
const distTotal = walk(dist)
  .filter((f) => EXT.includes(extname(f)))
  .reduce((n, f) => n + gz(f), 0);

if (asJson) {
  console.log(JSON.stringify({ rows, chunks, runtimeTotal, distTotal }, null, 2));
  process.exit(0);
}

console.log("\nPer component (gzip KB): own = component files, shared = reachable shared chunks\n");
console.log("component".padEnd(18), "own".padStart(6), "shared".padStart(8), "total".padStart(7));
for (const r of rows.sort((a, b) => b.own - a.own)) {
  console.log(r.name.padEnd(18), kb(r.own).padStart(6), kb(r.shared).padStart(8), kb(r.total).padStart(7));
}

console.log("\nShared chunks (gzip KB)\n");
console.log("chunk".padEnd(44), "raw".padStart(7), "gzip".padStart(7), "usedBy".padStart(8));
for (const c of chunks) {
  console.log(c.file.padEnd(44), kb(c.raw).padStart(7), kb(c.gzip).padStart(7), String(c.usedBy).padStart(8));
}

console.log(`\nSum of runtime component files: ${kb(runtimeTotal)} KB gzip`);
console.log(`Sum of all dist files (per-file gzip): ${kb(distTotal)} KB gzip\n`);

