import { isPlainObject } from "./guard";
import { isEqual } from "./equal";

function hasDeletedOrUndefinedKeys(
  prev: Record<string, any>,
  next: Record<string, any>,
): boolean {
  for (const k of Object.keys(prev)) {
    if (prev[k] !== undefined && (!(k in next) || next[k] === undefined)) {
      return true;
    }
  }
  for (const k of Object.keys(next)) {
    if (next[k] === undefined) {
      return true;
    }
  }
  return false;
}

function stripUndefined<T>(val: T): T {
  if (Array.isArray(val)) {
    let mutated = false;
    const copy = val.map((item) => {
      if (item === undefined) {
        mutated = true;
        return null;
      }
      const cleaned = stripUndefined(item);
      if (cleaned !== item) mutated = true;
      return cleaned;
    });
    return (mutated ? copy : val) as unknown as T;
  }
  if (isPlainObject(val)) {
    let mutated = false;
    const out: Record<string, any> = {};
    for (const k of Object.keys(val)) {
      const v = (val as Record<string, any>)[k];
      if (v === undefined) {
        mutated = true;
        continue;
      }
      const cleaned = stripUndefined(v);
      if (cleaned !== v) mutated = true;
      out[k] = cleaned;
    }
    return (mutated ? out : val) as unknown as T;
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

    if (isEqual(pVal, nVal)) continue;

    if (Array.isArray(pVal) && Array.isArray(nVal)) {
      if (pVal.length !== nVal.length) {
        delta[path] = stripUndefined(nVal);
        hasDiff = true;
      } else {
        for (let i = 0; i < nVal.length; i++) {
          if (isEqual(pVal[i], nVal[i])) continue;
          const subPath = `${path}[${i}]`;
          if (isPlainObject(pVal[i]) && isPlainObject(nVal[i])) {
            if (hasDeletedOrUndefinedKeys(pVal[i], nVal[i])) {
              delta[subPath] = stripUndefined(nVal[i]);
              hasDiff = true;
            } else {
              const sub = diffSnapshot(pVal[i], nVal[i], subPath);
              if (sub) {
                Object.assign(delta, sub);
                hasDiff = true;
              }
            }
          } else {
            delta[subPath] = nVal[i] === undefined ? null : stripUndefined(nVal[i]);
            hasDiff = true;
          }
        }
      }
    } else if (isPlainObject(pVal) && isPlainObject(nVal)) {
      if (hasDeletedOrUndefinedKeys(pVal, nVal)) {
        delta[path] = stripUndefined(nVal);
        hasDiff = true;
      } else {
        const sub = diffSnapshot(pVal, nVal, path);
        if (sub) {
          Object.assign(delta, sub);
          hasDiff = true;
        }
      }
    } else {
      delta[path] = stripUndefined(nVal);
      hasDiff = true;
    }
  }

  return hasDiff ? delta : null;
}
