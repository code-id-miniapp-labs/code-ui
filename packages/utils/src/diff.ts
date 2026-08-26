import { isPlainObject } from "./guard";
import { isEqual } from "./equal";

export function diffSnapshot(
  prev: Record<string, any> | undefined,
  next: Record<string, any>,
  prefix?: string,
): Record<string, any> | null {
  if (!prev) {
    return prefix ? { [prefix]: next } : next;
  }

  const delta: Record<string, any> = {};
  let hasDiff = false;

  for (const k of Object.keys(next)) {
    const path = prefix ? `${prefix}.${k}` : k;
    const pVal = prev[k];
    const nVal = next[k];

    if (isEqual(pVal, nVal)) continue;

    if (isPlainObject(pVal) && isPlainObject(nVal)) {
      const sub = diffSnapshot(pVal, nVal, path);
      if (sub) {
        Object.assign(delta, sub);
        hasDiff = true;
      }
    } else {
      delta[path] = nVal;
      hasDiff = true;
    }
  }

  return hasDiff ? delta : null;
}
