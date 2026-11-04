// Per-source generated-bytes breakdown for a minified chunk using its sourcemap.
// Usage: node scripts/chunk-breakdown.mjs packages/components/dist/common.js
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/chunk-breakdown.mjs <chunk.js>");
  process.exit(1);
}
const code = readFileSync(file, "utf8");
const map = JSON.parse(readFileSync(file + ".map", "utf8"));

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const val = Object.fromEntries([...B64].map((c, i) => [c, i]));
function decodeSegment(seg) {
  const out = [];
  let shift = 0;
  let value = 0;
  for (const ch of seg) {
    const d = val[ch];
    value += (d & 31) << shift;
    if (d & 32) shift += 5;
    else {
      out.push(value & 1 ? -(value >> 1) : value >> 1);
      value = 0;
      shift = 0;
    }
  }
  return out;
}

const lines = code.split("\n");
const bytes = new Map(); // source -> generated chars
const slices = new Map(); // source -> concatenated generated text (for gzip estimate)
let src = 0;
map.mappings.split(";").forEach((line, li) => {
  const text = lines[li] ?? "";
  let col = 0;
  const segs = line.split(",").filter(Boolean).map(decodeSegment);
  const starts = [];
  for (const s of segs) {
    col += s[0];
    if (s.length >= 4) {
      src += s[1];
      starts.push({ col, src });
    }
  }
  starts.forEach((s, i) => {
    const end = i + 1 < starts.length ? starts[i + 1].col : text.length;
    const piece = text.slice(s.col, end);
    const name = map.sources[s.src];
    bytes.set(name, (bytes.get(name) ?? 0) + piece.length);
    slices.set(name, (slices.get(name) ?? "") + piece);
  });
  // WeChat/sourcemap: source index is cumulative across lines; keep `src` as is.
});

const rows = [...bytes.entries()]
  .map(([name, n]) => ({
    name: name.replace(/^.*node_modules\//, "nm/").replace(/^(\.\.\/)+/, ""),
    raw: n,
    gzip: gzipSync(slices.get(name), { level: 9 }).length,
  }))
  .sort((a, b) => b.raw - a.raw);

const totalRaw = rows.reduce((n, r) => n + r.raw, 0);
console.log(`\n${file}: ${totalRaw} chars across ${rows.length} sources\n`);
console.log("raw".padStart(7), "gzip*".padStart(7), " source");
for (const r of rows) console.log(String(r.raw).padStart(7), String(r.gzip).padStart(7), " " + r.name);
console.log("\n*gzip of each source's slice alone (overstates when summed; shows relative weight)\n");

