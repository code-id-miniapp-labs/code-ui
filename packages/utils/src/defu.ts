// ─────────────────────────────────────────────────────────────────────────────
// defu.ts — recursive object & defaults merging utility
// ─────────────────────────────────────────────────────────────────────────────

import { isArray, isFunction, isPlainObject } from "./guard";

export type DefuCustomMerger = (
  target: Record<string, any>,
  key: string,
  value: any,
  namespace: string,
) => boolean | void;

export type Defu<Source, Defaults> = Source extends undefined | null
  ? Defaults
  : Source extends Array<infer SItem>
    ? Defaults extends Array<infer DItem>
      ? Array<SItem | DItem>
      : Source
    : Source extends (...args: any[]) => any
      ? Source
      : Source extends Record<string, any>
        ? Defaults extends Record<string, any>
          ? {
              [K in keyof Source | keyof Defaults]: K extends keyof Source
                ? K extends keyof Defaults
                  ? Defu<Source[K], Defaults[K]>
                  : Source[K]
                : K extends keyof Defaults
                  ? Defaults[K]
                  : never;
            }
          : Source
        : Source;

export interface DefuFn {
  <Source = any, Defaults = any>(
    source: Source,
    defaults: Defaults,
  ): Defu<Source, Defaults>;
  <Source = any, D1 = any, D2 = any>(
    source: Source,
    d1: D1,
    d2: D2,
  ): Defu<Defu<Source, D1>, D2>;
  <Source = any, D1 = any, D2 = any, D3 = any>(
    source: Source,
    d1: D1,
    d2: D2,
    d3: D3,
  ): Defu<Defu<Defu<Source, D1>, D2>, D3>;
  <Source = any, Defaults = any>(source: Source, ...defaults: Defaults[]): any;
}

function clone(obj: any): any {
  if (isArray(obj)) {
    return obj.map(clone);
  }
  if (isPlainObject(obj)) {
    const res: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      if (key !== "__proto__" && key !== "constructor") {
        res[key] = clone(obj[key]);
      }
    }
    return res;
  }
  return obj;
}

function _defu(
  target: Record<string, any>,
  source: Record<string, any>,
  merger?: DefuCustomMerger,
  namespace = "",
): Record<string, any> {
  if (!source || typeof source !== "object") {
    return target;
  }

  for (const key of Object.keys(source)) {
    // Prevent prototype pollution
    if (key === "__proto__" || key === "constructor") {
      continue;
    }

    const value = source[key];
    if (value === undefined) {
      continue;
    }

    const currentPath = namespace ? `${namespace}.${key}` : key;

    // Allow custom merger to intercept
    if (merger && merger(target, key, value, currentPath)) {
      continue;
    }

    if (isArray(value)) {
      if (isArray(target[key])) {
        // Array concat (standard defu behavior)
        target[key] = [...target[key], ...value];
      } else if (target[key] === undefined) {
        target[key] = clone(value);
      }
    } else if (isPlainObject(value)) {
      if (isPlainObject(target[key])) {
        _defu(target[key], value, merger, currentPath);
      } else if (target[key] === undefined) {
        target[key] = _defu({}, value, merger, currentPath);
      }
    } else if (target[key] === undefined) {
      target[key] = clone(value);
    }
  }

  return target;
}

/**
 * Creates a customized defu merge function.
 */
export function createDefu(merger?: DefuCustomMerger): DefuFn {
  return function defuInstance(source: any, ...defaults: any[]): any {
    let result: any = clone(source);

    for (const d of defaults) {
      if (d && typeof d === "object") {
        if (!isPlainObject(result)) {
          result = _defu({}, d, merger);
        } else {
          _defu(result, d, merger);
        }
      }
    }

    return result ?? {};
  } as DefuFn;
}

/**
 * Recursively merge objects with defaults (leftmost arguments take precedence).
 *
 * @example
 * defu({ a: 1 }, { a: 2, b: 3 }) // { a: 1, b: 3 }
 * defu({ nested: { foo: 'custom' } }, { nested: { foo: 'default', bar: 123 } })
 * // { nested: { foo: 'custom', bar: 123 } }
 */
export const defu: DefuFn = createDefu();

/**
 * Defu variant where arrays in source replace arrays in defaults instead of concatenating.
 */
export const defuReplace: DefuFn = createDefu((target, key, value) => {
  if (isArray(target[key]) || isArray(value)) {
    if (target[key] !== undefined) {
      // Keep target array as-is
      return true;
    }
    target[key] = isArray(value) ? [...value] : value;
    return true;
  }
});

/**
 * Defu variant that executes functions in source with default value as argument.
 */
export const defuFn: DefuFn = createDefu((target, key, value) => {
  if (isFunction(target[key])) {
    target[key] = target[key](value);
    return true;
  }
});
