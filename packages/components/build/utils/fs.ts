import fs from "node:fs";
import path from "node:path";

/**
 * Recursively collects file paths under `dir` whose names end with `ext`.
 */
export function findFilesByExt(
  dir: string,
  ext: string,
  fileList: string[] = [],
): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const filePath = path.join(dir, entry);
    if (fs.statSync(filePath).isDirectory()) {
      findFilesByExt(filePath, ext, fileList);
    } else if (filePath.endsWith(ext)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}
