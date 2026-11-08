import { isPlainObject } from "./guard";
import { isEqual } from "./equal";

function hasDeletedOrUndefinedKeys(
  prev: Record<string, any>,
  next: Record<string, any>,
): boolean {
  for (const k in prev) {
    if (prev[k] !== undefined && (!(k in next) || next[k] === undefined)) return true;
  }
  for (const k in next) {
    if (next[k] === undefined) return true;
  }
  return false;
}

function stripUndefined<T>(val: T): T {
  if (Array.isArray(val)) {
    return val.map((v) => (v === undefined ? null : stripUndefined(v))) as unknown as T;
  }
  if (isPlainObject(val)) {
    const out: Record<string, any> = {};
    for (const k in val) {
      const v = (val as Record<string, any>)[k];
      if (v !== undefined) out[k] = stripUndefined(v);
    }
    return out as unknown as T;
  }
  return val;
}

export function diffSnapshot(
  prev: Record<string, any> | undefined,
  next: Record<string, any>,
  prefix?: string,
): Record<string, any> | null {
  if (!prev) {
    const cleaned = stripUndefined(next);
    return prefix ? { [prefix]: cleaned } : cleaned;
  }

  const delta: Record<string, any> = {};
  let hasDiff = false;

  for (const k of Object.keys(next)) {
    const path = prefix ? `${prefix}.${k}` : k;
    const pVal = prev[k];
    const nVal = next[k];

    if (nVal === undefined) {
      if (pVal !== undefined) {
        delta[path] = null;
        hasDiff = true;
      }
      continue;
    }

    if (pVal === nVal || Object.is(pVal, nVal)) continue;

    if (Array.isArray(pVal) && Array.isArray(nVal)) {
      if (pVal.length !== nVal.length) {
        delta[path] = stripUndefined(nVal);
        hasDiff = true;
      } else {
        for (let i = 0; i < nVal.length; i++) {
          const pi = pVal[i];
          const ni = nVal[i];
          if (pi === ni || Object.is(pi, ni)) continue;
          const subPath = `${path}[${i}]`;
          if (isPlainObject(pi) && isPlainObject(ni)) {
            if (hasDeletedOrUndefinedKeys(pi, ni)) {
              if (!isEqual(pi, ni)) {
                delta[subPath] = stripUndefined(ni);
                hasDiff = true;
              }
            } else {
              const sub = diffSnapshot(pi, ni, subPath);
              if (sub) {
                Object.assign(delta, sub);
                hasDiff = true;
              }
            }
          } else if (!isEqual(pi, ni)) {
            delta[subPath] = ni === undefined ? null : stripUndefined(ni);
            hasDiff = true;
          }
        }
      }
    } else if (isPlainObject(pVal) && isPlainObject(nVal)) {
      if (hasDeletedOrUndefinedKeys(pVal, nVal)) {
        if (!isEqual(pVal, nVal)) {
          delta[path] = stripUndefined(nVal);
          hasDiff = true;
        }
      } else {
        const sub = diffSnapshot(pVal, nVal, path);
        if (sub) {
          Object.assign(delta, sub);
          hasDiff = true;
        }
      }
    } else if (!isEqual(pVal, nVal)) {
      delta[path] = stripUndefined(nVal);
      hasDiff = true;
    }
  }

  return hasDiff ? delta : null;
}
