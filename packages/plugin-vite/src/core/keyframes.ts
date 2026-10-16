import fs from "node:fs";
import path from "node:path";

const KEYFRAMES_NAME_RE = /@keyframes\s+([a-zA-Z0-9_-]+)/;

export function cleanKeyframes(css: string): string {
  const firstIdx = css.indexOf("@keyframes");
  // Fast bailout when 0 or 1 @keyframes block exists (cannot have duplicates)
  if (firstIdx === -1 || css.indexOf("@keyframes", firstIdx + 10) === -1) {
    return css;
  }

  const seen = new Set<string>();
  const chunks: string[] = [];
  let i = 0;

  while (i < css.length) {
    const atKeyframesIdx = i === 0 ? firstIdx : css.indexOf("@keyframes", i);
    if (atKeyframesIdx === -1) {
      chunks.push(css.slice(i));
      break;
    }
    if (atKeyframesIdx > i) {
      chunks.push(css.slice(i, atKeyframesIdx));
    }

    const openBraceIdx = css.indexOf("{", atKeyframesIdx);
    if (openBraceIdx === -1) {
      chunks.push(css.slice(atKeyframesIdx));
      break;
    }

    const header = css.slice(atKeyframesIdx, openBraceIdx);
    const nameMatch = KEYFRAMES_NAME_RE.exec(header);
    const name = nameMatch ? nameMatch[1] : null;

    let depth = 1;
    let endIdx = openBraceIdx + 1;
    while (depth > 0 && endIdx < css.length) {
      const ch = css.charCodeAt(endIdx);
      if (ch === 123 /* '{' */) depth++;
      else if (ch === 125 /* '}' */) depth--;
      endIdx++;
    }

    if (!name || !seen.has(name)) {
      if (name) seen.add(name);
      chunks.push(css.slice(atKeyframesIdx, endIdx));
    }
    i = endIdx;
  }

  return chunks.join("");
}

export function cleanKeyframesInDir(
  dir: string,
  skipFiles?: ReadonlySet<string>,
): void {
  if (!fs.existsSync(dir)) return;

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.name === "node_modules") continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      cleanKeyframesInDir(fullPath, skipFiles);
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".wxss") || entry.name.endsWith(".css"))
    ) {
      if (skipFiles?.has(fullPath)) continue;
      try {
        const content = fs.readFileSync(fullPath, "utf8");
        const cleaned = cleanKeyframes(content);
        if (content !== cleaned) {
          fs.writeFileSync(fullPath, cleaned, "utf8");
        }
      } catch {
        // ignore read/write errors
      }
    }
  }
}
